"""
Base class for all exercise trackers with shared functionality
"""
import math
import time

class LowPassFilter:
    """
    Simple Low Pass Filter (Exponential Moving Average)
    Good balance for smoothing vs latency
    """
    def __init__(self, alpha=0.5):
        self.alpha = alpha
        self.last_value = None

    def filter(self, value):
        if self.last_value is None:
            self.last_value = value
            return value
        
        filtered = self.alpha * value + (1.0 - self.alpha) * self.last_value
        self.last_value = filtered
        return filtered

class OneEuroFilter:
    """
    1€ Filter: Adaptive Low Pass Filter
    Minimizes jitter while maintaining responsiveness during fast movement.
    """
    def __init__(self, min_cutoff=1.0, beta=0.007, d_cutoff=1.0):
        self.min_cutoff = min_cutoff  # Decrease to reduce jitter (more lag)
        self.beta = beta              # Increase to reduce lag during movement
        self.d_cutoff = d_cutoff
        
        self.x_prev = None
        self.dx_prev = 0.0
        self.t_prev = None

    def filter(self, x, t=None):
        if t is None:
            t = time.time()
            
        if self.x_prev is None:
            self.x_prev = x
            self.dx_prev = 0.0
            self.t_prev = t
            return x

        dt = t - self.t_prev
        
        # Avoid division by zero
        if dt <= 0:
            return self.x_prev

        # Compute the filtered derivative of the signal
        dx = (x - self.x_prev) / dt
        edx = self.exponential_smoothing(dx, self.dx_prev, 
                                        self.alpha(self.d_cutoff, dt))
        
        # Use the filtered derivative to compute the cutoff frequency
        cutoff = self.min_cutoff + self.beta * abs(edx)
        
        # Filter the signal
        result = self.exponential_smoothing(x, self.x_prev, 
                                          self.alpha(cutoff, dt))
        
        self.x_prev = result
        self.dx_prev = edx
        self.t_prev = t
        
        return result

    def exponential_smoothing(self, a, x_prev, alpha):
        return alpha * a + (1.0 - alpha) * x_prev

    def alpha(self, cutoff, dt):
        tau = 1.0 / (2 * math.pi * cutoff)
        return 1.0 / (1.0 + tau / dt)

class ExerciseState:
    """Enum-like class for exercise states"""
    START = 0      # Initial position / Extended
    ECCENTRIC = 1  # Moving down / Lengthening muscle
    BOTTOM = 2     # Lowest point / Max Extension (or Flexion depending on exercise)
    CONCENTRIC = 3 # Moving up / Shortening muscle
    TOP = 4        # Peak contraction / Max Flexion
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
from abc import ABC, abstractmethod
from .config import MEDIAPIPE_CONFIG, DRAW_CONFIG


class Landmark:
    def __init__(self, x, y, z, visibility):
        self.x = x
        self.y = y
        self.z = z
        self.visibility = visibility

class BaseTracker(ABC):
    """Abstract base class for exercise trackers"""
    
    def __init__(self):
        """Initialize MediaPipe Pose Landmarker and shared properties"""
        self.landmarker = None # Lazy init or separate
        try:
             self.landmarker = self._create_landmarker()
        except:
             print("MediaPipe model not found or failed to load. Server-side detection disabled.")

        self.frame_timestamp_ms = 0
        self.warning_message = ""
        self.latest_landmarks = None
        self.is_tracking = False  # To control when to start counting
        self.current_rep_start_time = None # Initialize to avoid AttributeError

    def process_landmarks(self, landmarks_data, timestamp_ms=0):
        """
        Process landmarks directly (from client-side detection)
        Args:
            landmarks_data: List of dicts {'x':.., 'y':.., 'z':.., 'visibility':..}
            timestamp_ms: Timestamp of the frame in milliseconds
        """
        if not landmarks_data:
            return None
            
        # Update timestamp
        self.frame_timestamp_ms = timestamp_ms

        # Convert simple dicts to Landmark objects
        self.latest_landmarks = [
            Landmark(l.get('x', 0), l.get('y', 0), l.get('z', 0), l.get('visibility', 0)) 
            for l in landmarks_data
        ]
        
        # Perform exercise-specific tracking (frame is None as we don't have it)
        return self._track_exercise(self.latest_landmarks, None)

        
    def _create_landmarker(self):
        """Create and configure MediaPipe PoseLandmarker"""
        base_options = python.BaseOptions(
            model_asset_path=MEDIAPIPE_CONFIG['model_path']
        )
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_poses=MEDIAPIPE_CONFIG['num_poses'],
            min_pose_detection_confidence=MEDIAPIPE_CONFIG['min_pose_detection_confidence'],
            min_pose_presence_confidence=MEDIAPIPE_CONFIG['min_pose_presence_confidence'],
            min_tracking_confidence=MEDIAPIPE_CONFIG['min_tracking_confidence']
        )
        return vision.PoseLandmarker.create_from_options(options)
    
    def calculate_angle(self, a, b, c):
        """
        Calculate angle between three points
        
        Args:
            a, b, c: Landmark objects with x, y coordinates
            
        Returns:
            float: Angle in degrees
        """
        a = np.array([a.x, a.y])
        b = np.array([b.x, b.y])
        c = np.array([c.x, c.y])
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        return 360 - angle if angle > 180.0 else angle
    
    def _draw_landmarks(self, frame, landmarks):
        """
        Draw pose landmarks and connections on frame
        
        Args:
            frame: Image frame (numpy array)
            landmarks: List of pose landmarks
        """
        h, w, _ = frame.shape
        
        # Draw landmarks (joints)
        for landmark in landmarks:
            x = int(landmark.x * w)
            y = int(landmark.y * h)
            cv2.circle(
                frame, 
                (x, y), 
                DRAW_CONFIG['landmark_radius'], 
                DRAW_CONFIG['landmark_color'], 
                -1
            )
        
        # Draw connections (bones)
        for connection in DRAW_CONFIG['connections']:
            start_idx, end_idx = connection
            if start_idx < len(landmarks) and end_idx < len(landmarks):
                start = landmarks[start_idx]
                end = landmarks[end_idx]
                start_point = (int(start.x * w), int(start.y * h))
                end_point = (int(end.x * w), int(end.y * h))
                cv2.line(
                    frame, 
                    start_point, 
                    end_point, 
                    DRAW_CONFIG['connection_color'], 
                    DRAW_CONFIG['connection_thickness']
                )
    
    def reset(self):
        """Reset tracker state (override in subclasses if needed)"""
        self.warning_message = ""
        self.frame_timestamp_ms = 0
        self.reps_history = []
        # Set start time to now so the first rep has a valid duration
        self.current_rep_start_time = cv2.getTickCount() / cv2.getTickFrequency()
        self.current_rep_feedbacks = [] # List of {body_part, issue, timestamp}

    def add_feedback(self, body_part, issue):
        """Add feedback/warning for the current rep"""
        if not self.is_tracking:
            return
            
        # Avoid duplicate feedback for the same issue in the same rep to prevent spamming
        # But we might want to know distinct occurrences? 
        # For scoring 5/3/1, we care about "Warning Count".
        # Let's check if this specific issue was already added recently or just add it.
        # User requirement: "3 is 1 warning point, 1 is 2+ warning points".
        # So unique warnings matter.
        
        # Check if we already have this issue recorded for this rep
        for fb in self.current_rep_feedbacks:
            if fb['issue'] == issue:
                return

        now_sec = self.frame_timestamp_ms / 1000.0
        self.current_rep_feedbacks.append({
            "body_part": body_part,
            "issue": issue,
            "timestamp": round(now_sec, 2)
        })

    def _finish_rep(self, rep_count):
        """
        Record a finished rep with score and details
        """
        now = cv2.getTickCount() / cv2.getTickFrequency()
        duration = 0
        if self.current_rep_start_time:
            duration = now - self.current_rep_start_time
        
        # Calculate Score (5/3/1 System)
        warning_count = len(self.current_rep_feedbacks)
        score = 5
        if warning_count == 1:
            score = 3
        elif warning_count >= 2:
            score = 1
        
        rep_data = {
            "rep_number": rep_count,
            "score": score,
            "duration": round(duration, 2),
            "warning_count": warning_count,
            "feedbacks": list(self.current_rep_feedbacks), # Copy list
            "timestamp": now
        }
        
        self.reps_history.append(rep_data)
        
        # Reset for next rep
        self.current_rep_start_time = now
        self.current_rep_feedbacks = []
        
        print(f"Rep {rep_count} finished. Score: {score}. Warnings: {warning_count}")

    def get_session_summary(self):
        """
        Calculate total session stats
        """
        if not self.reps_history:
            return {
                "total_reps": 0,
                "average_score": 0,
                "reps_history": []
            }
            
        scores = [r['score'] for r in self.reps_history]
        total_score = sum(scores)
        avg_score = total_score / len(self.reps_history)
        max_score = max(scores)
        min_score = min(scores)
        
        # Calculate accuracy percentage based on perfect reps (score 5 or warning_count 0)
        # "Accuracy tells how accurate we are in that video, calculated from Total Reps and Number of Times with Warnings"
        # Implies (Total Reps - Reps With Warnings) / Total Reps
        perfect_reps = sum(1 for r in self.reps_history if r.get('warning_count', 0) == 0)
        accuracy_percent = (perfect_reps / len(self.reps_history)) * 100 if self.reps_history else 0

        return {
            "total_reps": len(self.reps_history),
            "total_score": total_score,
            "average_score": round(avg_score, 2),
            "max_score": max_score,
            "min_score": min_score,
            "accuracy_percent": round(accuracy_percent, 2),
            "reps_history": self.reps_history
        }
    
    def process_frame(self, frame):
        """
        Process video frame and perform exercise tracking
        
        Args:
            frame: RGB image frame (numpy array)
            
        Returns:
            Processed frame and tracking data (varies by exercise type)
        """
        self.latest_landmarks = None
        # Convert frame to MediaPipe Image
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
        
        # Increment timestamp
        self.frame_timestamp_ms += 33  # ~30 FPS
        
        # Detect pose landmarks
        result = self.landmarker.detect_for_video(mp_image, self.frame_timestamp_ms)
        
        tracking_data = {"status": "no_pose", "landmarks": None}
        
        if result.pose_landmarks:
            # Get first pose
            landmarks = result.pose_landmarks[0]
            self.latest_landmarks = landmarks
            
            # Draw landmarks on frame (Optional - can be commented out if not needed)
            # self._draw_landmarks(frame, landmarks)
            
            # Perform exercise-specific tracking
            return self._track_exercise(landmarks, frame)
        
        return self._get_default_return_values(frame)
    
    @abstractmethod
    def _track_exercise(self, landmarks, frame):
        """
        Exercise-specific tracking logic (must be implemented by subclasses)
        
        Args:
            landmarks: Detected pose landmarks
            frame: Image frame
            
        Returns:
            Tracking data specific to the exercise
        """
        pass
    
    @abstractmethod
    def _get_default_return_values(self, frame):
        """
        Return default values when no pose is detected
        
        Returns:
            Default values for this exercise type
        """
        pass
    
    def get_stats(self):
        """
        Get current tracking statistics (override in subclasses if needed)
        
        Returns:
            dict: Statistics dictionary
        """
        return {}
    

    
    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'landmarker') and self.landmarker:
            self.landmarker.close()
