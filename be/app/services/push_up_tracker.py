import cv2
from .base_tracker import BaseTracker
from .config import PUSH_UP_CONFIG, LANDMARKS, DISPLAY_CONFIG


class PushUpTracker(BaseTracker):
    """Tracker for push-up exercise"""
    
    def __init__(self):
        super().__init__()
        self.count = 0
        self.direction = 0
    
    def _track_exercise(self, landmarks, frame):
        """Track push-up exercise"""
        try:
            config = PUSH_UP_CONFIG
            
            # Check visibility of key landmarks
            # Push-up relies on side view (usually left side)
            key_points = [
                LANDMARKS['LEFT_SHOULDER'],
                LANDMARKS['LEFT_ELBOW'],
                LANDMARKS['LEFT_WRIST'],
                LANDMARKS['LEFT_HIP']
            ]
            
            for point_idx in key_points:
                if landmarks[point_idx].visibility < 0.5:
                    self.warning_message = "ไม่พบจุดตรวจจับ"
                    return frame

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
            if shoulder_angle > config['shoulder_angle_threshold']:
                self.warning_message += config['warnings']['shoulder_too_high']
                self.add_feedback("Shoulders", "Too high")
            if elbow_angle < config['elbow_low_threshold']:
                self.warning_message += config['warnings']['elbow_too_low']
                self.add_feedback("Elbows", "Too low")

            # State machine: Up(0) -> Down(1) -> Up(0) = 1 complete rep
            # direction=0: up position (arms extended), direction=1: down position (arms bent)
            if elbow_angle <= config['elbow_angle_down_threshold'] and self.direction == 0:
                self.direction = 1  # Moved to down position

            if elbow_angle >= config['elbow_angle_up_threshold'] and self.direction == 1:
                self.direction = 0  # Back to up position — rep complete
                if self.is_tracking:
                    self.count += 1
                    self._finish_rep(self.count)
                    print(f"Push-up Count: {self.count}")

            # Display metrics (Commented out for JSON output)
            # cv2.putText(frame, f'Elbow Angle: {int(elbow_angle)}', (10, 100),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['angle_label_color'], DISPLAY_CONFIG['font_thickness'])
            # cv2.putText(frame, f'Shoulder Angle: {int(shoulder_angle)}', (10, 130),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['angle_label_color'], DISPLAY_CONFIG['font_thickness'])
            # cv2.putText(frame, f'Push-up Count: {self.count}', (10, 160),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['count_label_color'], DISPLAY_CONFIG['font_thickness'])

            # if self.warning_message:
            #     cv2.putText(frame, self.warning_message, (10, 190),
            #                 DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #                 DISPLAY_CONFIG['warning_label_color'], DISPLAY_CONFIG['font_thickness'])
            
            return frame
        except Exception as e:
            print("Error calculating push-up angle:", e)
            return frame
    
    def _get_default_return_values(self, frame):
        """Return default values when no pose detected"""
        return frame
    
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
