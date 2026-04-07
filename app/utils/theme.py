from PySide6.QtGui import QPalette, QColor
from PySide6.QtWidgets import QApplication

def apply_theme(app: QApplication):
    # Base dark theme palette
    palette = QPalette()
    
    # Define Core Colors
    background_dark = QColor("#1e1e2e")
    surface_dark = QColor("#181825")
    primary_accent = QColor("#89b4fa")  # A nice relaxing blue
    text_primary = QColor("#cdd6f4")
    text_secondary = QColor("#a6adc8")
    
    # Base
    palette.setColor(QPalette.ColorRole.Window, background_dark)
    palette.setColor(QPalette.ColorRole.WindowText, text_primary)
    
    # Inputs and List Views
    palette.setColor(QPalette.ColorRole.Base, surface_dark)
    palette.setColor(QPalette.ColorRole.AlternateBase, background_dark)
    palette.setColor(QPalette.ColorRole.ToolTipBase, text_primary)
    palette.setColor(QPalette.ColorRole.ToolTipText, text_primary)
    palette.setColor(QPalette.ColorRole.Text, text_primary)
    
    # Buttons/Highlights
    palette.setColor(QPalette.ColorRole.Button, surface_dark)
    palette.setColor(QPalette.ColorRole.ButtonText, text_primary)
    palette.setColor(QPalette.ColorRole.BrightText, QColor("#f38ba8"))
    palette.setColor(QPalette.ColorRole.Link, primary_accent)
    palette.setColor(QPalette.ColorRole.Highlight, primary_accent)
    palette.setColor(QPalette.ColorRole.HighlightedText, QColor("#11111b"))

    app.setPalette(palette)
    
    # Minimal QSS for specifics
    qss = """
    QMainWindow {
        background-color: #1e1e2e;
    }
    QWidget {
        font-family: 'Segoe UI', Inter, sans-serif;
        font-size: 14px;
    }
    #SidebarFrame {
        background-color: #11111b; 
        border-right: 1px solid #313244;
    }
    #SidebarLogo {
        font-size: 20px; 
        font-weight: bold; 
        color: #89b4fa; 
        border: none; 
        padding-left: 10px; 
        margin-bottom: 20px;
    }
    #MainHeader {
        font-size: 18px; 
        font-weight: 500; 
        color: #cdd6f4;
    }
    #ViewTitle {
        font-size: 24px; 
        font-weight: bold; 
        margin-bottom: 20px;
    }
    #ViewSubtitle {
        color: #a6adc8; 
        font-size: 16px;
    }
    #SectionTitle {
        font-size: 18px;
        font-weight: 500;
        color: #cdd6f4;
        margin-top: 15px;
        margin-bottom: 5px;
    }
    #DashboardCard {
        background-color: #181825;
        border: 1px solid #313244;
        border-radius: 8px;
        padding: 10px;
    }
    #CardTitle {
        font-size: 13px;
        color: #a6adc8;
        font-weight: 500;
    }
    #CardValue {
        font-size: 28px;
        font-weight: bold;
        color: #89b4fa;
        margin-top: 5px;
    }
    #DashboardTable, #DashboardList {
        background-color: #181825;
        border: 1px solid #313244;
        border-radius: 6px;
        padding: 5px;
    }
    #DashboardList::item {
        padding: 8px;
        border-bottom: 1px solid #313244;
        color: #cdd6f4;
    }
    #DashboardList::item:hover {
        background-color: #313244;
    }
    QPushButton#NavButton {
        text-align: left; 
        padding-left: 15px; 
        background: transparent; 
        border: none; 
        color: #cdd6f4; 
        font-size: 15px; 
    }
    QPushButton#NavButton:hover {
        background: #313244; 
        border-radius: 6px; 
    }
    QPushButton#NavButton:pressed {
        background: #45475a; 
    }
    
    QHeaderView::section {
        background-color: #181825;
        color: #a6adc8;
        padding: 5px;
        border: none;
        border-bottom: 1px solid #313244;
    }
    QTableView {
        background-color: #181825;
        gridline-color: #313244;
        border: none;
    }
    QScrollBar:vertical {
        background: #181825;
        width: 10px;
    }
    QScrollBar::handle:vertical {
        background: #313244;
        border-radius: 5px;
    }
    QPushButton {
        background-color: #313244;
        border-radius: 4px;
        padding: 6px 16px;
        color: #cdd6f4;
    }
    QPushButton:hover {
        background-color: #45475a;
    }
    QPushButton:pressed {
        background-color: #585b70;
    }
    QLineEdit, QComboBox {
        background-color: #11111b;
        border: 1px solid #313244;
        border-radius: 4px;
        padding: 4px 8px;
        color: #cdd6f4;
    }
    """
    app.setStyleSheet(qss)
