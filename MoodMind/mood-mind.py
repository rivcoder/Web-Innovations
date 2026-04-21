import sys
import os
import json
import datetime
import random
from math import sin, cos, pi
from PyQt6.QtWidgets import (
    QApplication, QWidget, QLabel, QTextEdit, QPushButton, QVBoxLayout, QHBoxLayout,
    QFrame, QMessageBox, QFileDialog, QGraphicsOpacityEffect
)
from PyQt6.QtCore import Qt, QTimer, QPropertyAnimation, QEasingCurve
from PyQt6.QtGui import QPainter, QColor, QFont, QIcon
import matplotlib.pyplot as plt

# ----------------------------
# Data + Sentiment
# ----------------------------
DATA_FILE = os.path.join(os.path.dirname(__file__), "mood_data.json")

# Non-overlapping, explicit word lists
HAPPY_WORDS = {"happy", "joy", "good", "great", "love", "excited", "glad", "optimistic", "relaxed", "calm", "content",
               "peace", "fantastic", "awesome", "nice", "pleased"}
SAD_WORDS = {"sad", "cry", "crying", "cried", "crybaby", "tears", "tearful", "broken", "heartbroken", "pain", "hurt",
             "suffering", "miserable", "depressed", "lonely", "down"}
ANGRY_WORDS = {"angry", "hate", "upset", "mad", "frustrated"}
ANXIOUS_WORDS = {"anxious", "worried", "panic", "nervous", "uneasy", "stressed", "fear", "afraid"}
NEUTRAL_WORDS = {"okay", "fine", "meh", "neutral", "tired", "bad"}

MOOD_QUOTES = {
    "happy": [
        "Happiness often sneaks in through a door you didn't know you left open. John Barrymore",
        "Do more of what makes you happy."
    ],
    "sad": [
        "This too shall pass.",
        "Tears are words the heart can't say out loud."
    ],
    "anxious": [
        "You don't have to control your thoughts. You just have to stop letting them control you.",
        "Breathe. You've survived 100% of your worst days  you'll survive this one."
    ],
    "angry": [
        "For every minute you remain angry, you give up sixty seconds of peace. Ralph Waldo Emerson",
        "Take a deep breath. Calmness is a superpower."
    ],
    "neutral": [
        "Small steps every day.",
        "A little progress is still progress."
    ]
}


def load_entries():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_entries(entries):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Error saving:", e)


def simple_sentiment(text):
    """REVISED: Uses clear, non-overlapping counts and dynamic confidence calculation."""
    words = [w.strip(".,!?;:()[]\"'").lower() for w in text.split()]

    # Non-overlapping counts
    pos_c = sum(1 for w in words if w in HAPPY_WORDS)
    sad_c = sum(1 for w in words if w in SAD_WORDS)
    angry_c = sum(1 for w in words if w in ANGRY_WORDS)
    anx_c = sum(1 for w in words if w in ANXIOUS_WORDS)
    neu_c = sum(1 for w in words if w in NEUTRAL_WORDS)

    # Calculate a simplified score (Positive - Negative)
    score = pos_c - (sad_c + angry_c + anx_c)

    # All explicit mood counts
    all_counts = {"happy": pos_c, "sad": sad_c, "angry": angry_c, "anxious": anx_c, "neutral": neu_c}
    total_relevant_words = sum(all_counts.values())

    # --- DOMINANCE LOGIC (Mood Determination) ---

    # 1. HAPPY: Check if positive words clearly outweigh negative and exists
    if pos_c > (sad_c + angry_c + anx_c) * 0.5 and pos_c >= 1:
        mood = "happy"

    # 2. ANGRY: Check for angry dominance over other specific negative moods
    elif angry_c > sad_c and angry_c > anx_c and angry_c >= 1:
        mood = "angry"

    # 3. SAD: Check for sad dominance over other specific negative moods
    elif sad_c > angry_c and sad_c > anx_c and sad_c >= 1:
        mood = "sad"

    # 4. ANXIOUS: Check if anxious is dominant or ties other negatives
    elif anx_c >= max(sad_c, angry_c) and anx_c >= 1:
        mood = "anxious"

    # 5. NEUTRAL: Check if neutral words dominate all other categories
    elif neu_c > max(pos_c, sad_c, angry_c, anx_c):
        mood = "neutral"

    # 6. NEUTRAL FALLBACK: If the score is close to zero (balanced or all counts low)
    elif abs(score) <= 1.5:
        mood = "neutral"

    else:
        # Final fallback
        if score < 0:
            mood = "sad"
        else:
            mood = "neutral"

    # --- CONFIDENCE CALCULATION FIX ---

    if total_relevant_words == 0:
        confidence = 0.5  # Default confidence if no mood words found
        return mood, confidence

    c_dominant = all_counts.get(mood, 0)

    if mood == "neutral":
        # For neutral, confidence is based on the neutral word ratio and how balanced the score is
        neutral_ratio = neu_c / total_relevant_words

        # If there's a strong neutral ratio, confidence is high.
        # Scale it down so 1.0 ratio is 0.8
        confidence = min(0.80, max(0.4, neutral_ratio * 0.9))

    else:
        # For non-neutral moods, confidence is based on how dominant the mood words are
        # compared to ALL other mood words.

        # confidence_base is the ratio of the dominant mood count to ALL mood words found
        confidence_base = c_dominant / total_relevant_words

        # Scaling: A 1.0 ratio becomes 0.9. A 0.5 ratio becomes 0.5. This is dynamic.
        # Minimum set to 0.3 for a determined mood.
        confidence = min(0.90, max(0.3, confidence_base * 0.9))

    return mood, confidence


# ----------------------------
# Animated background
# ----------------------------
class Particle:
    def __init__(self, w, h, palette):
        self.w = w;
        self.h = h
        self.palette = palette
        self.reset()

    def reset(self):
        self.x = random.uniform(0, self.w)
        self.y = random.uniform(0, self.h)
        self.r = random.uniform(8, 60)
        self.vx = random.uniform(-0.6, 0.6)
        self.vy = random.uniform(-0.2, -1.2)
        self.alpha = random.uniform(30, 220)
        self.color = random.choice(self.palette)
        self.phase = random.uniform(0, 2 * pi)
        self.amp = random.uniform(2, 18)

    def step(self):
        # gentle sinusoidal motion plus vertical float
        self.x += self.vx + cos(self.phase) * 0.2
        self.y += self.vy + sin(self.phase) * 0.1
        self.phase += 0.03
        if self.y + self.r < -100 or self.x < -200 or self.x > self.w + 200:
            self.reset()


class ParticleBackground(QWidget):
    def __init__(self, parent=None, num=20):
        super().__init__(parent)
        # safe palette (RGB tuples)
        self.palette = [(120, 180, 255), (170, 140, 255), (120, 220, 200), (200, 170, 255)]
        self.particles = [Particle(800, 600, self.palette) for _ in range(num)]
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.on_step)
        self.timer.start(30)

    def resizeEvent(self, ev):
        for p in self.particles:
            p.w = self.width();
            p.h = self.height()

    def on_step(self):
        for p in self.particles:
            p.step()
        # safe update
        try:
            self.update()
        except Exception:
            pass

    def paintEvent(self, ev):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        # light + positive base
        painter.fillRect(self.rect(), QColor(245, 250, 255))
        for p in self.particles:
            r, g, b = p.color
            col = QColor(r, g, b, max(6, min(255, int(p.alpha))))
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(col)
            painter.drawEllipse(int(p.x), int(p.y), int(p.r), int(p.r))


# ----------------------------
# Splash / Intro
# ----------------------------
class SplashScreen(QWidget):
    def __init__(self, duration=3500):
        super().__init__()
        self.duration = duration
        self.setup_ui()

    def setup_ui(self):
        # safer to use maximized instead of full-screen in some PyQt builds
        self.setWindowFlag(Qt.WindowType.FramelessWindowHint)
        self.showMaximized()
        self.setStyleSheet("""
            background: qlineargradient(x1:0,y1:0,x2:1,y2:1,
                        stop:0 #071233, stop:1 #1a3b6b);
""")
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        title = QLabel("MoodMind")
        title.setFont(QFont("Segoe UI", max(36, int(self.screen().size().height() * 0.06)), QFont.Weight.Bold))
        title.setStyleSheet("color: #91c9ff;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)

        subtitle = QLabel("AI Mood Journal")
        subtitle.setFont(QFont("Segoe UI", max(18, int(self.screen().size().height() * 0.025))))
        subtitle.setStyleSheet("color: #d8e6fa;")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)

        layout.addWidget(title)
        layout.addWidget(subtitle)

    def show_and_wait(self, on_finished):
        self.show()
        # safe timer to close splash and call on_finished
        QTimer.singleShot(self.duration, lambda: (self.close(), on_finished()))


# ----------------------------
# Main MoodMind app
# ----------------------------
class MoodMindApp(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("MoodMind  AI Mood Journal")
        self.setWindowIcon(QIcon())
        self.resize(980, 640)

        # particle background (visual)
        self.bg = ParticleBackground(self, num=22)
        self.bg.setGeometry(0, 0, self.width(), self.height())

        # UI container
        container = QFrame(self)
        margin = 36
        container.setGeometry(margin, margin, self.width() - 2 * margin, self.height() - 2 * margin)
        container.setStyleSheet("background: rgba(255,255,255,0.86); border-radius:12px;")
        container_layout = QVBoxLayout(container)
        container_layout.setContentsMargins(16, 16, 16, 16)
        container_layout.setSpacing(12)

        title = QLabel("MoodMind")
        title.setFont(QFont("Segoe UI", 30, QFont.Weight.DemiBold))
        title.setStyleSheet("color: #265a78;")
        subtitle = QLabel("Write your thoughts. I'll guess your mood and share a quote.")
        subtitle.setFont(QFont("Segoe UI", 10))
        subtitle.setStyleSheet("color: #1f4b66;")

        self.text_edit = QTextEdit()
        self.text_edit.setPlaceholderText("Share how you're feeling, what happened today, or anything on your mind...")
        self.text_edit.setMinimumHeight(220)
        self.text_edit.setStyleSheet("background: rgba(255,255,255,0.98); border-radius:8px; padding:8px;")

        # buttons
        btn_analyze = QPushButton("Analyze Mood")
        btn_analyze.clicked.connect(self.on_analyze)
        btn_save = QPushButton("Save Entry")
        btn_save.clicked.connect(self.on_save)
        btn_export = QPushButton("Export Entries")
        btn_export.clicked.connect(self.on_export)
        btn_graph = QPushButton("Weekly Analysis (Graph)")
        btn_graph.clicked.connect(self.on_graph)

        btn_row = QHBoxLayout()
        btn_row.addWidget(btn_analyze)
        btn_row.addWidget(btn_save)
        btn_row.addWidget(btn_graph)
        btn_row.addWidget(btn_export)

        self.result_label = QLabel("Mood: | Confidence: ")
        self.result_label.setFont(QFont("Segoe UI", 12))
        self.result_label.setStyleSheet("background: rgba(255,255,255,0.9); padding:8px; border-radius:6px;")

        self.quote_label = QLabel("Quote will appear here after analysis.")
        self.quote_label.setWordWrap(True)
        self.quote_label.setFont(QFont("Segoe UI", 11))
        self.quote_label.setStyleSheet("background: rgba(255,255,255,0.9); padding:12px; border-radius:6px;")

        container_layout.addWidget(title)
        container_layout.addWidget(subtitle)
        container_layout.addWidget(self.text_edit)
        container_layout.addLayout(btn_row)
        container_layout.addWidget(self.result_label)
        container_layout.addWidget(self.quote_label)
        container_layout.addStretch(1)

        # load entries
        self.entries = load_entries()
        # keep reference to running animations to avoid GC
        self._active_animations = []

    def resizeEvent(self, ev):
        super().resizeEvent(ev)
        self.bg.setGeometry(0, 0, self.width(), self.height())

    def on_analyze(self):
        """Analyze button handler  wrapped in try/except to avoid crashes"""
        try:
            content = self.text_edit.toPlainText().strip()
            if not content:
                QMessageBox.information(self, "Empty", "Please write something to analyze.")
                return
            mood, conf = simple_sentiment(content)
            conf_pct = int(conf * 100)
            self.result_label.setText(f"Mood: {mood.capitalize()} | Confidence: {conf_pct}%")
            quote = random.choice(MOOD_QUOTES.get(mood, MOOD_QUOTES["neutral"]))
            self.quote_label.setText(f"{quote}")

            # SAFE visual: fade-in opacity effect on quote label
            try:
                effect = QGraphicsOpacityEffect(self.quote_label)
                self.quote_label.setGraphicsEffect(effect)
                anim = QPropertyAnimation(effect, b"opacity")
                anim.setDuration(420)
                anim.setStartValue(0.0)
                anim.setEndValue(1.0)
                anim.setEasingCurve(QEasingCurve.Type.OutCubic)
                anim.start()
                self._active_animations.append(anim)
                anim.finished.connect(lambda: self._safe_remove(anim))
            except Exception:
                # if animation fails for any reason, ignore it (non-fatal)
                pass

        except Exception as exc:
            # show the error and prevent app crash
            QMessageBox.critical(self, "Error during analysis", f"An unexpected error occurred:\n{exc}")
            # optional: print to console for debugging
            print("Error in on_analyze:", exc)

    def _safe_remove(self, anim):
        try:
            self._active_animations.remove(anim)
        except Exception:
            pass

    def on_save(self):
        content = self.text_edit.toPlainText().strip()
        if not content:
            QMessageBox.information(self, "Empty", "Write something before saving.")
            return
        mood, conf = simple_sentiment(content)
        entry = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "text": content,
            "mood": mood,
            "confidence": conf
        }
        self.entries.append(entry)
        save_entries(self.entries)
        QMessageBox.information(self, "Saved", f"Entry saved with mood '{mood}'.")
        self.text_edit.clear()

    def on_export(self):
        if not self.entries:
            QMessageBox.information(self, "No data", "No entries to export.")
            return
        path, _ = QFileDialog.getSaveFileName(self, "Export entries", os.path.expanduser("~"), "JSON Files (*.json)")
        if path:
            try:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(self.entries, f, ensure_ascii=False, indent=2)
                QMessageBox.information(self, "Exported", f"Entries exported to:\n{path}")
            except Exception as e:
                QMessageBox.warning(self, "Error", f"Failed to export: {e}")

    def on_graph(self):
        """Generates a clearer line graph for weekly mood trends."""
        now = datetime.datetime.utcnow()
        seven_days_ago = now - datetime.timedelta(days=7)
        recent = [e for e in self.entries if datetime.datetime.fromisoformat(e["timestamp"]) >= seven_days_ago]

        if not recent:
            QMessageBox.information(self, "No data", "No entries in the last 7 days to analyze.")
            return

        days = [(now - datetime.timedelta(days=i)).date() for i in range(6, -1, -1)]
        mood_map = {d: {"happy": 0, "sad": 0, "anxious": 0, "angry": 0, "neutral": 0} for d in days}

        # Populate mood counts
        for e in recent:
            dt = datetime.datetime.fromisoformat(e["timestamp"]).date()
            if dt in mood_map:
                # Count occurrences of each mood
                mood_map[dt][e["mood"]] = mood_map[dt].get(e["mood"], 0) + 1

        labels = []
        # Map moods to a numerical scale for plotting (4=Very Positive, 0=Very Negative)
        MOOD_GRAPH_SCORES = {"happy": 4, "neutral": 2, "anxious": 1, "sad": 0.5, "angry": 0}
        daily_scores = []

        for d in days:
            labels.append(d.strftime("%a\n%d %b"))
            counts = mood_map[d]

            if any(counts.values()):
                # Find the dominant mood for the day
                # Priority: 1. Count, 2. Score (to break ties)
                dominant_mood = max(counts.items(),
                                    key=lambda kv: (kv[1], MOOD_GRAPH_SCORES.get(kv[0], 2)))[0]

                # Append the corresponding score to the list
                daily_scores.append(MOOD_GRAPH_SCORES.get(dominant_mood, 2))
            else:
                # No entry, plot as neutral/mid-point
                daily_scores.append(2)

        # Use plt.plot for a better trend visualization
        plt.figure(figsize=(9, 5))
        plt.plot(labels, daily_scores, marker='o', linestyle='-', color='#1f4b66', linewidth=2, markersize=8)

        # Define the y-axis ticks and labels clearly
        y_ticks = [0, 1, 2, 3, 4]
        y_labels = ["Angry (0)", "Anxious (1)", "Neutral (2)", "Mostly Happy (3)", "Happy (4)"]

        plt.ylim(-0.2, 4.2)
        plt.yticks(y_ticks, y_labels)
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        plt.title("Weekly Mood Trend (Dominant Mood Score)", fontsize=14)
        plt.xlabel("Day", fontsize=12)
        plt.ylabel("Mood Score", fontsize=12)
        plt.tight_layout()
        plt.show()


# ----------------------------
# Launch (splash then main)
# ----------------------------
def main():
    app = QApplication(sys.argv)

    # show splash (from 2nd code style)
    splash = SplashScreen(duration=3500)

    # Use a QTimer to ensure main opens after splash closes
    def open_main():
        main_win = MoodMindApp()
        main_win.show()
        # keep reference on app to avoid GC
        app._main_win = main_win

    splash.show_and_wait(on_finished=open_main)

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
