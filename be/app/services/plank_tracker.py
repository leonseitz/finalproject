import cv2
from .base_tracker import BaseTracker
from .config import PLANK_CONFIG, LANDMARKS, DISPLAY_CONFIG
import time


class PlankTracker(BaseTracker):
    """Tracker for plank exercise - measures hold time"""
    
    
    def __init__(self):
        super().__init__()
        self.exercise_name = "Plank"
        self.plank_start_time = 0
        self.elapsed_time = 0
        self.paused_time = 0
        self.is_paused = False
        self.pause_count = 0  # Track number of times form was broken
        
        # Grace Period Logic
        self.warning_start_time = 0
        self.penalty_applied = False
    
    def _track_exercise(self, landmarks, frame):
        """Track plank exercise - time-based instead of reps"""
        try:
            config = PLANK_CONFIG
            
            # Check visibility of key landmarks
            # Plank relies on side view (usually left side for now)
            key_points = [
                LANDMARKS['LEFT_SHOULDER'],
                LANDMARKS['LEFT_ELBOW'],
                LANDMARKS['LEFT_WRIST'],
                LANDMARKS['LEFT_HIP'],
                LANDMARKS['LEFT_KNEE']
            ]
            
            for point_idx in key_points:
                if landmarks[point_idx].visibility < 0.5:
                    self.warning_message = "ไม่พบจุดตรวจจับ"
                    # Return early/skip calculation if points are not visible
                    # But we must return the expected tuple
                    return frame, 0, 0

            # Calculate elbow angle
            elbow_angle = self.calculate_angle(
                landmarks[LANDMARKS['LEFT_SHOULDER']],
                landmarks[LANDMARKS['LEFT_ELBOW']],
                landmarks[LANDMARKS['LEFT_WRIST']]
            )
            
            # Calculate body angle (shoulder-hip-knee alignment)
            body_angle = self.calculate_angle(
                landmarks[LANDMARKS['LEFT_SHOULDER']],
                landmarks[LANDMARKS['LEFT_HIP']],
                landmarks[LANDMARKS['LEFT_KNEE']]
            )

            # Check form and warnings
            self.warning_message = ""
            if body_angle > config['body_angle_high_threshold']:
                self.warning_message += config['warnings']['hips_too_high']
                self.add_feedback("Hips", "Too high")
            if body_angle < config['body_angle_low_threshold']:
                self.warning_message += config['warnings']['hips_too_low']
                self.add_feedback("Hips", "Too low")
            if abs(body_angle - 180) > config['body_angle_deviation']:
                self.warning_message += config['warnings']['back_not_straight']
                self.add_feedback("Back", "Not straight")

            # Determine Raw Form Status
            raw_is_good = (
                self.is_tracking and 
                config['elbow_angle_min'] < elbow_angle < config['elbow_angle_max'] and 
                config['body_angle_min'] < body_angle < config['body_angle_max']
            )

            # Grace Period Logic: Determine Effective Status
            effective_is_good = False
            
            if raw_is_good:
                # Good form: Reset warning/penalty states
                self.warning_start_time = 0
                self.penalty_applied = False
                effective_is_good = True
            else:
                # Bad form: Check grace period
                if self.warning_start_time == 0:
                    self.warning_start_time = time.time()
                
                time_in_warning = time.time() - self.warning_start_time
                
                if time_in_warning > 3.0:
                    # Exceeded grace period -> Real Bad Form
                    effective_is_good = False
                    
                    # Apply penalty once per violation
                    if not self.penalty_applied:
                        self.pause_count += 1
                        self.penalty_applied = True
                        print(f"Plank paused: Form break #{self.pause_count} (Duration > 3s)")
                else:
                    # Within grace period -> Treat as Good Form (don't stop timer yet)
                    effective_is_good = True


            # Track plank time based on Effective Status
            if effective_is_good:
                # Start or continue timing
                if self.is_paused:
                    self.plank_start_time += time.time() - self.paused_time
                    self.is_paused = False
                if self.plank_start_time == 0:
                    self.plank_start_time = time.time()
                self.elapsed_time = time.time() - self.plank_start_time
            else:
                # Pause timing
                if not self.is_paused and self.plank_start_time != 0:
                    self.paused_time = time.time()
                    self.is_paused = True
                    # Penalty already applied above
                    
            return frame, elbow_angle, body_angle
        except Exception as e:
            print("Error calculating plank angle:", e)
            return frame, 0, 0
    
    def _get_default_return_values(self, frame):
        """Return default values when no pose detected"""
        return frame, 0, 0
    
    
    def get_session_summary(self):
        """
        Override to return a single 'rep' representing the whole plank session
        with scoring based on pauses and duration.
        """
        # Score calculation for Plank:
        # Quality Score based on Pauses:
        # 0 Pauses = 5 (Perfect)
        # 1 Pause = 3 (Minor issues)
        # >1 Pauses = 1 (Major issues)
        
        quality_score = 5
        if self.pause_count == 1:
            quality_score = 3
        elif self.pause_count > 1:
            quality_score = 1
            
        # usage of self.current_rep_feedbacks might be tricky here since we don't finish reps
        # All feedbacks are accumulating in self.current_rep_feedbacks via add_feedback
        
        # Calculate "Virtual Reps" based on duration (e.g., 10 seconds = 1 rep)
        # using max(1, ...) to ensure at least 1 rep if detailed
        virtual_reps = max(1, int(self.elapsed_time / 10))
        
        # Total Score = Quality Score * Virtual Reps
        total_score = quality_score * virtual_reps
            
        # Create the single rep data representing the session
        rep_data = {
            "rep_number": 1,
            "score": quality_score, # Store quality score here for "average" display
            "duration": round(self.elapsed_time, 2),
            "warning_count": self.pause_count, # Use pause count as warning metric
            "feedbacks": list(self.current_rep_feedbacks),
            "timestamp": time.time()
        }
        
        single_rep_history = [rep_data]
        
        return {
            "total_reps": virtual_reps, 
            "total_score": total_score,
            "average_score": quality_score,
            "max_score": quality_score, 
            "min_score": quality_score,
            "accuracy_percent": 100 if self.pause_count == 0 else (50 if self.pause_count == 1 else 0), # Rough estimate
            "reps_history": single_rep_history,
            "total_time": round(self.elapsed_time, 2)
        }

    def reset(self):
        """Reset tracker state"""
        super().reset()
        self.plank_start_time = 0
        self.elapsed_time = 0
        self.paused_time = 0
        self.is_paused = False
        self.pause_count = 0
        
        # Reset Grace Period
        self.warning_start_time = 0
        self.penalty_applied = False
