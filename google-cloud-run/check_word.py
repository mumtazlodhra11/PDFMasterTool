import win32com.client
import os

def test_word():
    print("Testing Word Automation...")
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = True # Make it visible to see if it opens
        print("Word Application successfully dispatched.")
        print(f"Version: {word.Version}")
        word.Quit()
        print("Word Application closed.")
        return True
    except Exception as e:
        print(f"Failed to control Word: {e}")
        return False

if __name__ == "__main__":
    test_word()
