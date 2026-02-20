import cv2
from .base_tracker import BaseTracker
from .config import SQUAT_CONFIG, LANDMARKS, DISPLAY_CONFIG


class SquatTracker(BaseTracker):
    """Tracker for squat exercise"""
    
    def __init__(self):
        super().__init__()
        self.count = 0
        self.direction = 0
        self.squat_depth = None
    
    def _track_exercise(self, landmarks, frame):
        """Track squat exercise"""
        try:
            config = SQUAT_CONFIG
            
            # Check visibility of key landmarks
            # Squat relies on side view (usually left side)
            key_points = [
                LANDMARKS['LEFT_SHOULDER'],
                LANDMARKS['LEFT_HIP'],
                LANDMARKS['LEFT_KNEE'],
                LANDMARKS['LEFT_ANKLE']
            ]
            
            for point_idx in key_points:
                if landmarks[point_idx].visibility < 0.5:
                    self.warning_message = "ไม่พบจุดตรวจจับ"
                    return frame

            # Calculate knee angle
            knee_angle = self.calculate_angle(
                landmarks[LANDMARKS['LEFT_HIP']],
                landmarks[LANDMARKS['LEFT_KNEE']],
                landmarks[LANDMARKS['LEFT_ANKLE']]
            )
            
            # Calculate hip angle
            hip_angle = self.calculate_angle(
                landmarks[LANDMARKS['LEFT_SHOULDER']],
                landmarks[LANDMARKS['LEFT_HIP']],
                landmarks[LANDMARKS['LEFT_KNEE']]
            )
            
            # Check for warnings
            self.warning_message = ""
            if knee_angle < config['knee_angle_low_threshold']:
                self.warning_message += config['warnings']['knee_angle_too_low']
                self.add_feedback("Knee", "Knee too low")
            
            # Track squat movement
            if hip_angle > config['hip_angle_up_threshold']:
                self.direction = 0  # Standing position
            if hip_angle < config['hip_angle_down_threshold'] and self.direction == 0:
                self.direction = 1  # Squat position
                if self.is_tracking:
                    self.count += 1
                    print(f"Squat Count: {self.count}")
                self.squat_depth = "Deep enough" if hip_angle < config['good_depth_threshold'] else "Increase depth"
                if self.squat_depth == "Increase depth" and self.is_tracking:
                    self.add_feedback("Hips", "Not deep enough")
            
            # Display metrics (Commented out for JSON output)
            # cv2.putText(frame, f'Hip Angle: {int(hip_angle)}', (10, 100),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['angle_label_color'], DISPLAY_CONFIG['font_thickness'])
            # cv2.putText(frame, f'Squat Count: {self.count}', (10, 130),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['count_label_color'], DISPLAY_CONFIG['font_thickness'])
            
            # if self.warning_message:
            #     cv2.putText(frame, self.warning_message, (10, 160),
            #                 DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #                 DISPLAY_CONFIG['warning_label_color'], DISPLAY_CONFIG['font_thickness'])
            
            return frame
        except Exception as e:
            print("Error calculating squat angle:", e)
            return frame
    
    def _get_default_return_values(self, frame):
        """Return default values when no pose detected"""
        return frame
    
    def get_stats(self):
        """Get current tracking statistics"""
        return {
            'count': self.count,
            'squat_depth': self.squat_depth
        }
    
    def reset(self):
        """Reset tracker state"""
        super().reset()
        self.count = 0
        self.direction = 0
        self.squat_depth = None
