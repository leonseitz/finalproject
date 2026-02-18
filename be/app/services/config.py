"""
Configuration file for exercise tracking parameters
"""

# MediaPipe Configuration
MEDIAPIPE_CONFIG = {
    'model_path': 'pose_landmarker_full.task',
    'running_mode': 'VIDEO',
    'num_poses': 1,
    'min_pose_detection_confidence': 0.5,
    'min_pose_presence_confidence': 0.5,
    'min_tracking_confidence': 0.5
}

# Bicep Curl Configuration
BICEP_CURL_CONFIG = {
    'angle_up_threshold': 150,
    'angle_down_threshold': 50,
    'angle_too_low_threshold': 30,
    'angle_too_high_threshold': 160,
    'shoulder_angle_threshold': 20,
    'warnings': {
        'right_bent_too_much': 'Right arm is bent too much!',
        'right_stretched_too_far': 'Right arm is stretched too far!',
        'right_shoulder_high': 'Right shoulder is raised too high!',
        'left_bent_too_much': 'Left arm is bent too much!',
        'left_stretched_too_far': 'Left arm is stretched too far!',
        'left_shoulder_high': 'Left shoulder is raised too high!'
    }
}

# Pull-up Configuration
PULL_UP_CONFIG = {
    'angle_up_threshold': 150,
    'angle_down_threshold': 20,
    'elbow_too_bent_threshold': 15,
    'warnings': {
        'elbows_bent_too_much': 'Elbows are bent too much!'
    }
}

# Squat Configuration
SQUAT_CONFIG = {
    'hip_angle_up_threshold': 170,
    'hip_angle_down_threshold': 85,
    'knee_angle_low_threshold': 60,
    'good_depth_threshold': 90,
    'warnings': {
        'knee_angle_too_low': 'Warning: Knee angle too low!'
    }
}

# Push-up Configuration
PUSH_UP_CONFIG = {
    'elbow_angle_up_threshold': 160,
    'elbow_angle_down_threshold': 80,
    'shoulder_angle_threshold': 90,
    'elbow_low_threshold': 80,
    'warnings': {
        'shoulder_too_high': 'Warning: Shoulder angle too high! ',
        'elbow_too_low': 'Warning: Elbow angle too low! '
    }
}

# Plank Configuration
PLANK_CONFIG = {
    'elbow_angle_min': 70,
    'elbow_angle_max': 110,
    'body_angle_min': 150,
    'body_angle_max': 190,
    'body_angle_straight_min': 170,
    'body_angle_straight_max': 190,
    'body_angle_high_threshold': 200,
    'body_angle_low_threshold': 170,
    'body_angle_deviation': 10,
    'warnings': {
        'hips_too_high': 'Warning: Hips too high! ',
        'hips_too_low': 'Warning: Hips too low! ',
        'back_not_straight': 'Warning: Back not straight! '
    }
}

# Drawing Configuration
DRAW_CONFIG = {
    'landmark_color': (0, 255, 0),
    'landmark_radius': 3,
    'connection_color': (255, 255, 255),
    'connection_thickness': 2,
    # Pose connections (MediaPipe standard)
    'connections': [
        (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),  # Arms
        (11, 23), (12, 24), (23, 24),  # Torso
        (23, 25), (25, 27), (24, 26), (26, 28)  # Legs
    ]
}

# Display Configuration
DISPLAY_CONFIG = {
    'font': 1,  # cv2.FONT_HERSHEY_SIMPLEX
    'font_scale': 1,
    'font_thickness': 2,
    'exercise_label_position': (10, 50),
    'exercise_label_color': (0, 255, 255),
    'angle_label_color': (0, 255, 0),
    'count_label_color': (255, 255, 0),
    'warning_label_color': (0, 0, 255)
}

# Exercise Types
EXERCISE_TYPES = {
    1: 'Bicep Curl',
    2: 'Pull-up',
    3: 'Squat',
    4: 'Push-up',
    5: 'Plank'
}

# Landmark Indices (MediaPipe Pose)
LANDMARKS = {
    'LEFT_SHOULDER': 11,
    'RIGHT_SHOULDER': 12,
    'LEFT_ELBOW': 13,
    'RIGHT_ELBOW': 14,
    'LEFT_WRIST': 15,
    'RIGHT_WRIST': 16,
    'LEFT_HIP': 23,
    'RIGHT_HIP': 24,
    'LEFT_KNEE': 25,
    'RIGHT_KNEE': 26,
    'LEFT_ANKLE': 27,
    'RIGHT_ANKLE': 28
}
