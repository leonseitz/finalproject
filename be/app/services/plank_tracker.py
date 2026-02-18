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
    
    def _track_exercise(self, landmarks, frame):
        """Track plank exercise - time-based instead of reps"""
        try:
            config = PLANK_CONFIG
            
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

            # Track plank time
            if (self.is_tracking and 
                config['elbow_angle_min'] < elbow_angle < config['elbow_angle_max'] and 
                config['body_angle_min'] < body_angle < config['body_angle_max']):
                # Good form - start or continue timing
                if self.is_paused:
                    self.plank_start_time += time.time() - self.paused_time
                    self.is_paused = False
                if self.plank_start_time == 0:
                    self.plank_start_time = time.time()
                self.elapsed_time = time.time() - self.plank_start_time
            else:
                # Bad form - pause timing
                if not self.is_paused and self.plank_start_time != 0:
                    self.paused_time = time.time()
                    self.is_paused = True
                    
            # Display metrics (Commented out for JSON output)
            # cv2.putText(frame, f'Time: {int(self.elapsed_time)} s', (10, 100),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['count_label_color'], DISPLAY_CONFIG['font_thickness'])
            # cv2.putText(frame, f'Elbow Angle: {int(elbow_angle)}', (10, 130),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['angle_label_color'], DISPLAY_CONFIG['font_thickness'])
            # cv2.putText(frame, f'Body Angle: {int(body_angle)}', (10, 160),
            #             DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #             DISPLAY_CONFIG['angle_label_color'], DISPLAY_CONFIG['font_thickness'])
            
            # if self.warning_message:
            #     cv2.putText(frame, self.warning_message, (10, 190),
            #                 DISPLAY_CONFIG['font'], DISPLAY_CONFIG['font_scale'],
            #                 DISPLAY_CONFIG['warning_label_color'], DISPLAY_CONFIG['font_thickness'])

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
        """
        # Create a single rep entry for the requested duration
        # Score calculation for Plank:
        # 5 = Perfect (No warnings)
        # 3 = Minor warnings (1 type of warning)
        # 1 = Major warnings (2+ types or frequent)
        
        # We can estimate warnings based on total feedbacks or unique issues
        # For now let's use the standard feedback list
        
        # Aggregate all feedbacks
        all_feedbacks = []
        # Since we didn't store feedbacks in current_rep_feedbacks using add_feedback in _track_exercise the same way as reps?
        # partial check: base_tracker's add_feedback appends to self.current_rep_feedbacks
        # PlankTracker calls self.add_feedback
        # So self.current_rep_feedbacks should contain all warnings from the session (since we never called _finish_rep to clear it)
        
        unique_issues = set(f['issue'] for f in self.current_rep_feedbacks)
        warning_count = len(unique_issues)
        
        score = 5
        if warning_count == 1:
            score = 3
        elif warning_count >= 2:
            score = 1
            
        # Create the single rep data
        rep_data = {
            "rep_number": 1,
            "score": score,
            "duration": round(self.elapsed_time, 2),
            "warning_count": warning_count,
            "feedbacks": list(self.current_rep_feedbacks),
            "timestamp": time.time()
        }
        
        single_rep_history = [rep_data]
        
        return {
            "total_reps": 1, # 1 session
            "average_score": score,
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
