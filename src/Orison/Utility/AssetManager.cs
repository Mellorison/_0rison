using System;
using System.Collections.Generic;
using System.IO;

namespace Orison;

/// <summary>
/// Centralized asset manager for loading and caching game assets.
/// Provides efficient loading and reuse of textures, sounds, and other resources.
/// </summary>
public class AssetManager
{
    private static AssetManager instance;
    private Dictionary<string, Texture> textureCache;
    private Dictionary<string, Sound> soundCache;
    private Dictionary<string, Font> fontCache;

    private string assetsPath;

    /// <summary>
    /// Gets the singleton instance of the AssetManager.
    /// </summary>
    public static AssetManager Instance
    {
        get
        {
            if (instance == null)
            {
                instance = new AssetManager();
            }
            return instance;
        }
    }

    /// <summary>
    /// The base path for loading assets.
    /// </summary>
    public string AssetsPath
    {
        get { return assetsPath; }
        set { assetsPath = value; }
    }

    private AssetManager()
    {
        textureCache = new Dictionary<string, Texture>();
        soundCache = new Dictionary<string, Sound>();
        fontCache = new Dictionary<string, Font>();

        // Default assets path
        assetsPath = "assets";
    }

    /// <summary>
    /// Loads a texture from the specified path, caching it for future use.
    /// </summary>
    /// <param name="path">The relative path to the texture file.</param>
    /// <returns>The loaded texture.</returns>
    public Texture LoadTexture(string path)
    {
        string fullPath = Path.Combine(assetsPath, path);

        if (textureCache.ContainsKey(fullPath))
        {
            return textureCache[fullPath];
        }

        try
        {
            var texture = new Texture(fullPath);
            textureCache[fullPath] = texture;
            return texture;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to load texture: {fullPath}");
            Console.WriteLine($"Error: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Loads a sound from the specified path, caching it for future use.
    /// </summary>
    /// <param name="path">The relative path to the sound file.</param>
    /// <returns>The loaded sound.</returns>
    public Sound LoadSound(string path)
    {
        string fullPath = Path.Combine(assetsPath, path);

        if (soundCache.ContainsKey(fullPath))
        {
            return soundCache[fullPath];
        }

        try
        {
            var sound = new Sound(fullPath);
            soundCache[fullPath] = sound;
            return sound;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to load sound: {fullPath}");
            Console.WriteLine($"Error: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Loads a font from the specified path, caching it for future use.
    /// </summary>
    /// <param name="path">The relative path to the font file.</param>
    /// <returns>The loaded font.</returns>
    public Font LoadFont(string path)
    {
        string fullPath = Path.Combine(assetsPath, path);

        if (fontCache.ContainsKey(fullPath))
        {
            return fontCache[fullPath];
        }

        try
        {
            var font = new Font(fullPath);
            fontCache[fullPath] = font;
            return font;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to load font: {fullPath}");
            Console.WriteLine($"Error: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Unloads a texture from the cache.
    /// </summary>
    /// <param name="path">The path of the texture to unload.</param>
    public void UnloadTexture(string path)
    {
        string fullPath = Path.Combine(assetsPath, path);

        if (textureCache.ContainsKey(fullPath))
        {
            textureCache[fullPath].Dispose();
            textureCache.Remove(fullPath);
        }
    }

    /// <summary>
    /// Unloads a sound from the cache.
    /// </summary>
    /// <param name="path">The path of the sound to unload.</param>
    public void UnloadSound(string path)
    {
        string fullPath = Path.Combine(assetsPath, path);

        if (soundCache.ContainsKey(fullPath))
        {
            soundCache[fullPath].Dispose();
            soundCache.Remove(fullPath);
        }
    }

    /// <summary>
    /// Unloads a font from the cache.
    /// </summary>
    /// <param name="path">The path of the font to unload.</param>
    public void UnloadFont(string path)
    {
        string fullPath = Path.Combine(assetsPath, path);

        if (fontCache.ContainsKey(fullPath))
        {
            fontCache[fullPath].Dispose();
            fontCache.Remove(fullPath);
        }
    }

    /// <summary>
    /// Clears all cached assets.
    /// </summary>
    public void ClearCache()
    {
        foreach (var texture in textureCache.Values)
        {
            texture.Dispose();
        }
        textureCache.Clear();

        foreach (var sound in soundCache.Values)
        {
            sound.Dispose();
        }
        soundCache.Clear();

        foreach (var font in fontCache.Values)
        {
            font.Dispose();
        }
        fontCache.Clear();
    }

    /// <summary>
    /// Gets the number of cached textures.
    /// </summary>
    public int CachedTextureCount
    {
        get { return textureCache.Count; }
    }

    /// <summary>
    /// Gets the number of cached sounds.
    /// </summary>
    public int CachedSoundCount
    {
        get { return soundCache.Count; }
    }

    /// <summary>
    /// Gets the number of cached fonts.
    /// </summary>
    public int CachedFontCount
    {
        get { return fontCache.Count; }
    }
}
