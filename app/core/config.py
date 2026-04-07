APP_NAME = "Sellora"
VERSION = "0.1.0"

# Main Window Constants
MIN_WIDTH = 1024
MIN_HEIGHT = 768

# Status Enums (Using string constants for basic typing without adding extra packages)
class StoreStatus:
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    RUNNING = "Running"
    BLOCKED = "Blocked"
    PAUSED = "Paused"

class ListingStatus:
    DRAFT = "Draft"
    READY_TO_UPLOAD = "Ready to Upload"
    UPLOADED = "Uploaded"
    LIVE = "Live"
    REMOVED = "Removed"
    BLOCKED = "Blocked"
