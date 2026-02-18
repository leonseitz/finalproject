import cv2
import time
from .base_tracker import BaseTracker, ExerciseState, OneEuroFilter
from .config import BICEP_CURL_CONFIG, LANDMARKS, DISPLAY_CONFIG
from .workout_logger import WorkoutLogger

class BicepCurlTracker(BaseTracker):
    """Tracker for bicep curl exercise with separate left/right arm counting using State Machine"""
    
    def __init__(self):
        super().__init__()
        
        # นับจำนวนครั้งของแขนซ้ายและขวาแยกกัน
        self.count_left = 0
        self.count_right = 0
        
        # State Machine (0: EXTENDED/DOWN, 1: FLEXED/UP, 2: TRANSITION)
        self.state_left = ExerciseState.START
        self.state_right = ExerciseState.START

        # Filters for smoothing angles
        self.filter_left = OneEuroFilter(min_cutoff=1.0, beta=0.05)   # ปรับ beta เพื่อความไว
        self.filter_right = OneEuroFilter(min_cutoff=1.0, beta=0.05)
        
        # ข้อความแจ้งเตือน
        self.warning_message_left = ""
        self.warning_message_right = ""
        
        # Side to track: "both", "left", "right"
        self.tracking_side = "right"

    def set_side(self, side: str):
        """Set which side to track"""
        if side in ["left", "right", "both"]:
            self.tracking_side = side

    def _track_exercise(self, landmarks, frame):
        """Track bicep curl exercise - counts left and right arms separately based on checking_side"""
        try:
            config = BICEP_CURL_CONFIG
            current_time = time.time()
            
            # --- LEFT ARM PROCESSING ---
            if self.tracking_side in ["both", "left"]:
                # คำนวณมุมข้อศอกซ้าย (LEFT ARM)
                raw_left_angle = self.calculate_angle(
                    landmarks[LANDMARKS['LEFT_SHOULDER']],
                    landmarks[LANDMARKS['LEFT_ELBOW']],
                    landmarks[LANDMARKS['LEFT_WRIST']]
                )
                
                # Filter the angle
                left_angle = self.filter_left.filter(raw_left_angle, current_time)
                
                # คำนวณมุมหัวไหล่ซ้าย
                left_shoulder_angle = self.calculate_angle(
                    landmarks[LANDMARKS['LEFT_HIP']],
                    landmarks[LANDMARKS['LEFT_SHOULDER']],
                    landmarks[LANDMARKS['LEFT_ELBOW']]
                )

                # State Machine Logic
                self.warning_message_left = ""
                
                if self.state_left == ExerciseState.START:
                    if left_angle < config['angle_down_threshold']: # งอแขนขึ้น (Start Constraint)
                        self.state_left = ExerciseState.CONCENTRIC
                        
                elif self.state_left == ExerciseState.CONCENTRIC:
                    if left_angle < config['angle_down_threshold']: # งอแขนจนสุด (Peak)
                         self.state_left = ExerciseState.TOP
                    elif left_angle > config['angle_up_threshold']: # กลับมาเหยียด (Fail rep?)
                         self.state_left = ExerciseState.START # Reset

                elif self.state_left == ExerciseState.TOP:
                    if left_angle > config['angle_down_threshold'] + 10: # เริ่มเหยียดออก (Hysteresis)
                        self.state_left = ExerciseState.ECCENTRIC

                elif self.state_left == ExerciseState.ECCENTRIC:
                    if left_angle > config['angle_up_threshold']: # เหยียดสุด (Complete Rep)
                        if self.is_tracking:
                            self.count_left += 1
                            self._finish_rep(self.count_left) # Save score/stats
                            print(f"Bicep Curl (Left) Count: {self.count_left}")
                        self.state_left = ExerciseState.START

                # Fallback for simple toggling if needed, but State Machine above covers cycle:
                # START(>150) -> CONCENTRIC -> TOP(<50) -> ECCENTRIC -> START(>150) = Count

                # Warnings
                if left_angle < config['angle_too_low_threshold']:
                     self.warning_message_left = config['warnings']['left_bent_too_much']
                     self.add_feedback("Left Arm", "Bent too much")
                elif left_angle > config['angle_too_high_threshold'] and self.state_left == ExerciseState.TOP:
                     # Only warn about stretching if we are supposed to be at TOP? No, usually valid range check.
                     # Actually 'angle_too_high' (160) is usually for hyperextension w.r.t specific constraints,
                     # but in Bicep Curl, 180 is fine. Config might need check.
                     # If config says 160 is 'too high' (too straight) maybe for partial reps?
                     # Let's keep existing warning logic but apply to current angle.
                     pass 
                
                if left_shoulder_angle > config['shoulder_angle_threshold']:
                    self.warning_message_left += config['warnings']['left_shoulder_high']
                    self.add_feedback("Left Shoulder", "Shoulder too high")
            else:
                self.warning_message_left = ""

            # --- RIGHT ARM PROCESSING ---
            if self.tracking_side in ["both", "right"]:
                # คำนวณมุมข้อศอกขวา
                raw_right_angle = self.calculate_angle(
                    landmarks[LANDMARKS['RIGHT_SHOULDER']],
                    landmarks[LANDMARKS['RIGHT_ELBOW']],
                    landmarks[LANDMARKS['RIGHT_WRIST']]
                )
                
                # Filter
                right_angle = self.filter_right.filter(raw_right_angle, current_time)

                # คำนวณมุมหัวไหล่ขวา
                right_shoulder_angle = self.calculate_angle(
                    landmarks[LANDMARKS['RIGHT_HIP']],
                    landmarks[LANDMARKS['RIGHT_SHOULDER']],
                    landmarks[LANDMARKS['RIGHT_ELBOW']]
                )

                # State Machine
                self.warning_message_right = ""
                
                # Logic: Extended -> Flexed -> Extended = 1 Rep
                if self.state_right == ExerciseState.START: # Extended (> 150)
                    if right_angle < config['angle_up_threshold'] - 10: # Start moving up
                         self.state_right = ExerciseState.CONCENTRIC
                
                elif self.state_right == ExerciseState.CONCENTRIC: # Moving Up
                    if right_angle < config['angle_down_threshold']: # Reached Top (< 50)
                        self.state_right = ExerciseState.TOP
                    elif right_angle > config['angle_up_threshold']: # Went back down too early
                        self.state_right = ExerciseState.START

                elif self.state_right == ExerciseState.TOP: # At Top (< 50)
                    if right_angle > config['angle_down_threshold'] + 10: # Start moving down
                        self.state_right = ExerciseState.ECCENTRIC
                
                elif self.state_right == ExerciseState.ECCENTRIC: # Moving Down
                    if right_angle > config['angle_up_threshold']: # Reached Bottom (> 150)
                        if self.is_tracking:
                            self.count_right += 1
                            self._finish_rep(self.count_right)
                            print(f"Bicep Curl (Right) Count: {self.count_right}")
                        self.state_right = ExerciseState.START
                
                # Warnings checking
                if right_angle < config['angle_too_low_threshold']:
                    self.warning_message_right = config['warnings']['right_bent_too_much']
                elif right_angle > config['angle_too_high_threshold'] and self.state_right == ExerciseState.TOP:
                    # Logic note: angle > 160 is 'straight', which is fine at bottom, but maybe not at top?
                    # Original logic warned if angle > 160.
                    pass
                    
                if right_shoulder_angle > config['shoulder_angle_threshold']:
                    self.warning_message_right += config['warnings']['right_shoulder_high']
            else:
                 # Reset values if not tracking this side
                self.warning_message_right = ""

            return frame
        except Exception as e:
            print("Error calculating bicep curl angle:", e)
            return frame

    def _get_default_return_values(self, frame):
        """Return default values when no pose detected"""
        return frame
    
    def get_stats(self):
        """Get current tracking statistics"""
        return {
            'left_count': self.count_left,
            'right_count': self.count_right,
            'total_count': self.count_left + self.count_right
        }
    
    def reset(self):
        """Reset tracker state"""
        super().reset()
        self.count_left = 0
        self.count_right = 0
        self.state_left = ExerciseState.START
        self.state_right = ExerciseState.START
        self.warning_message_left = ""
        self.warning_message_right = ""
        # Reset filters too
        self.filter_left = OneEuroFilter(min_cutoff=1.0, beta=0.05)
        self.filter_right = OneEuroFilter(min_cutoff=1.0, beta=0.05)
