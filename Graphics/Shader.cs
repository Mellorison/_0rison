using SFML.Graphics;

namespace _0rison {
    public class Shader {
        public SFML.Graphics.Shader SFMLShader { get; }

        public Shader(SFML.Graphics.Shader shader) {
            SFMLShader = shader;
        }

        public Shader(string fragmentShaderPath, bool isFile = true) {
            SFMLShader = isFile ? new SFML.Graphics.Shader(null, null, fragmentShaderPath) : new SFML.Graphics.Shader(null, null, fragmentShaderPath);
        }
    }
}
