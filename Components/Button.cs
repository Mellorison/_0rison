using SFML.Window;
using System.Collections.Generic;

namespace _0rison {
    public class Button {
        readonly HashSet<Key> keys = new HashSet<Key>();
        bool wasDown;

        public bool Pressed { get; private set; }

        public void AddKey(Key key) {
            keys.Add(key);
        }

        public void AddKey(params Key[] moreKeys) {
            if (moreKeys == null) return;
            for (int i = 0; i < moreKeys.Length; i++) {
                keys.Add(moreKeys[i]);
            }
        }

        public void Clear() {
            keys.Clear();
        }

        public void UpdateFirst() {
            bool isDown = false;
            foreach (var k in keys) {
                if (Keyboard.IsKeyPressed(k)) {
                    isDown = true;
                    break;
                }
            }

            Pressed = isDown && !wasDown;
            wasDown = isDown;
        }
    }
}
