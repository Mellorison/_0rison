using System;
using System.Diagnostics;

namespace Orison;

/// <summary>
/// A debug overlay component that displays FPS, memory usage, and entity count.
/// Attach this to an entity to display debug information in the game.
/// </summary>
public class DebugOverlay : Component
{
    private float updateTimer = 0;
    private const float UpdateInterval = 0.5f; // Update every 0.5 seconds

    private float currentFps = 0;
    private float memoryUsage = 0;
    private int entityCount = 0;

    private Text debugText;

    /// <summary>
    /// Whether to show FPS in the debug overlay.
    /// </summary>
    public bool ShowFps = true;

    /// <summary>
    /// Whether to show memory usage in the debug overlay.
    /// </summary>
    public bool ShowMemory = true;

    /// <summary>
    /// Whether to show entity count in the debug overlay.
    /// </summary>
    public bool ShowEntityCount = true;

    /// <summary>
    /// The color of the debug text.
    /// </summary>
    public Color TextColor = Color.White;

    /// <summary>
    /// The position offset of the debug overlay from the entity.
    /// </summary>
    public Vector2 Offset = new Vector2(10, 10);

    public override void Added()
    {
        base.Added();

        debugText = new Text("");
        debugText.Color = TextColor;
    }

    public override void Update()
    {
        base.Update();

        updateTimer += Game.DeltaTime;

        if (updateTimer >= UpdateInterval)
        {
            updateTimer = 0;

            // Update FPS
            if (ShowFps && Game != null)
            {
                currentFps = Game.Framerate;
            }

            // Update memory usage
            if (ShowMemory)
            {
                using (var process = Process.GetCurrentProcess())
                {
                    memoryUsage = process.PrivateMemorySize64 / 1024f / 1024f; // Convert to MB
                }
            }

            // Update entity count
            if (ShowEntityCount && Entity.Scene != null)
            {
                entityCount = Entity.Scene.Entities.Count;
            }

            // Update debug text
            UpdateDebugText();
        }
    }

    private void UpdateDebugText()
    {
        var text = "";

        if (ShowFps)
        {
            text += $"FPS: {currentFps:F1}\n";
        }

        if (ShowMemory)
        {
            text += $"Memory: {memoryUsage:F1} MB\n";
        }

        if (ShowEntityCount)
        {
            text += $"Entities: {entityCount}";
        }

        debugText.String = text;
    }

    public override void Render()
    {
        base.Render();

        if (debugText != null)
        {
            debugText.X = Entity.X + Offset.X;
            debugText.Y = Entity.Y + Offset.Y;
            debugText.Render();
        }
    }

    public override void Removed()
    {
        base.Removed();

        if (debugText != null)
        {
            debugText = null;
        }
    }
}
