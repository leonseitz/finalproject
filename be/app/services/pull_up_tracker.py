import cv2
from .base_tracker import BaseTracker
from .config import PULL_UP_CONFIG, LANDMARKS, DISPLAY_CONFIG


class PullUpTracker(BaseTracker):
    """Tracker for pull-up exercise"""
    
    def __init__(self):
        super().__init__()
        self.count = 0
        self.direction = 0
        self.last_angle = 0
    
    def _track_exercise(self, landmarks, frame):
        """Track pull-up exercise"""
        try:
            config = PULL_UP_CONFIG
            
            # Check visibility of key landmarks
            # Pull-up relies on back/front view but acts similar to other upper body checks
            # We check left side chain for consistency as per other trackers
            key_points = [
                LANDMARKS['LEFT_SHOULDER'],
                LANDMARKS['LEFT_ELBOW'],
                LANDMARKS['LEFT_WRIST'],
                LANDMARKS['LEFT_HIP']
            ]
            
            for point_idx in key_points:
                if landmarks[point_idx].visibility < 0.5:
                    self.warning_message = "ไม่พบจุดตรวจจับ"
                    return frame, None, None

            # Calculate elbow angle
            elbow_angle = self.calculate_angle(
                landmarks[LANDMARKS['LEFT_SHOULDER']],
                landmarks[LANDMARKS['LEFT_ELBOW']],
                landmarks[LANDMARKS['LEFT_WRIST']]
            )
            
            # Calculate shoulder angle
            shoulder_angle = self.calculate_angle(
                landmarks[LANDMARKS['LEFT_HIP']],
                landmarks[LANDMARKS['LEFT_SHOULDER']],
                landmarks[LANDMARKS['LEFT_ELBOW']]
            )

            # Check for warnings
            self.warning_message = ""
            if elbow_angle < config['elbow_too_bent_threshold']:
                self.warning_message += config['warnings']['elbows_bent_too_much']
                self.add_feedback("Elbows", "Bent too much")

            # Track pull-up movement
            if elbow_angle > config['angle_up_threshold']:
                self.direction = 0  # Down position
            if elbow_angle < config['angle_down_threshold'] and self.direction == 0:
                self.direction = 1  # Up position
                if self.is_tracking:
                    self.count += 1
                    self._finish_rep(self.count)
                    print(f"Pull-up Count: {self.count}")
                
            # Display metrics (Commented out for JSON output)
            # cv2.putText(frame, f'Elbow Angle: {int(elbow_angle)}', (10, 100),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['angle_label_color'], DISPLAY_CONFIG['font_thickness'])
            # cv2.putText(frame, f'Shoulder Angle: {int(shoulder_angle)}', (10, 130),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['angle_label_color'], DISPLAY_CONFIG['font_thickness'])
            # cv2.putText(frame, f'Pull-up Count: {self.count}', (10, 160),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['count_label_color'], DISPLAY_CONFIG['font_thickness'])
            
            # if self.warning_message:
            #     cv2.putText(frame, self.warning_message, (10, 190),
            #                 DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #                 DISPLAY_CONFIG['warning_label_color'], DISPLAY_CONFIG['font_thickness'])
            
            return frame, elbow_angle, shoulder_angle
        except Exception as e:
            print("Error calculating pull-up angle:", e)
            return frame, None, None
    
    def _get_default_return_values(self, frame):
        """Return default values when no pose detected"""
        return frame, None, None
    
    def get_stats(self):
        """Get current tracking statistics"""
        return {
            'count': self.count
        }
    
    def reset(self):
        """Reset tracker state"""
        super().reset()
        self.count = 0
        self.direction = 0
        self.last_angle = 0
