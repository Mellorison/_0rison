using System;

namespace Orison;

/// <summary>
/// A camera component that can be attached to an entity to control the view.
/// Provides smooth camera following, zooming, and shaking effects.
/// </summary>
public class Camera : Component
{
    private Vector2 position;
    private Vector2 targetPosition;
    private float zoom = 1f;
    private float targetZoom = 1f;
    private float rotation = 0f;
    private float targetRotation = 0f;

    private float followSpeed = 0.1f;
    private float zoomSpeed = 0.1f;
    private float rotationSpeed = 0.1f;

    private Vector2 shakeOffset;
    private float shakeIntensity = 0f;
    private float shakeDuration = 0f;
    private float shakeTimer = 0f;

    private Entity followTarget;
    private bool isFollowing = false;

    /// <summary>
    /// The current camera position.
    /// </summary>
    public Vector2 Position
    {
        get { return position; }
        set { targetPosition = value; }
    }

    /// <summary>
    /// The current zoom level.
    /// </summary>
    public float Zoom
    {
        get { return zoom; }
        set { targetZoom = Math.Max(0.01f, value); }
    }

    /// <summary>
    /// The current rotation in degrees.
    /// </summary>
    public float Rotation
    {
        get { return rotation; }
        set { targetRotation = value; }
    }

    /// <summary>
    /// How quickly the camera follows its target (0-1).
    /// </summary>
    public float FollowSpeed
    {
        get { return followSpeed; }
        set { followSpeed = Math.Clamp(value, 0f, 1f); }
    }

    /// <summary>
    /// How quickly the camera zooms (0-1).
    /// </summary>
    public float ZoomSpeed
    {
        get { return zoomSpeed; }
        set { zoomSpeed = Math.Clamp(value, 0f, 1f); }
    }

    /// <summary>
    /// How quickly the camera rotates (0-1).
    /// </summary>
    public float RotationSpeed
    {
        get { return rotationSpeed; }
        set { rotationSpeed = Math.Clamp(value, 0f, 1f); }
    }

    /// <summary>
    /// The entity to follow.
    /// </summary>
    public Entity FollowTarget
    {
        get { return followTarget; }
        set
        {
            followTarget = value;
            isFollowing = value != null;
        }
    }

    /// <summary>
    /// Offset from the follow target's position.
    /// </summary>
    public Vector2 FollowOffset = Vector2.Zero;

    /// <summary>
    /// Whether the camera is currently shaking.
    /// </summary>
    public bool IsShaking => shakeTimer < shakeDuration;

    public override void Update()
    {
        base.Update();

        // Update position
        if (isFollowing && followTarget != null)
        {
            targetPosition = followTarget.Position + FollowOffset;
        }

        position = Vector2.Lerp(position, targetPosition, followSpeed);

        // Update zoom
        zoom = Util.Lerp(zoom, targetZoom, zoomSpeed);

        // Update rotation
        rotation = Util.Lerp(rotation, targetRotation, rotationSpeed);

        // Update shake
        if (IsShaking)
        {
            shakeTimer += Game.DeltaTime;

            if (shakeTimer >= shakeDuration)
            {
                shakeIntensity = 0f;
                shakeOffset = Vector2.Zero;
            }
            else
            {
                float progress = shakeTimer / shakeDuration;
                float currentIntensity = shakeIntensity * (1f - progress);

                shakeOffset = new Vector2(
                    (float)(Math.Sin(shakeTimer * 50) * currentIntensity),
                    (float)(Math.Cos(shakeTimer * 50) * currentIntensity)
                );
            }
        }

        // Apply camera to game
        if (Game != null)
        {
            Game.CameraX = position.X + shakeOffset.X;
            Game.CameraY = position.Y + shakeOffset.Y;
            Game.CameraZoom = zoom;
            Game.CameraAngle = rotation;
        }
    }

    /// <summary>
    /// Sets the camera to follow an entity.
    /// </summary>
    /// <param name="target">The entity to follow.</param>
    /// <param name="offset">Offset from the target's position.</param>
    public void Follow(Entity target, Vector2? offset = null)
    {
        FollowTarget = target;
        if (offset.HasValue)
        {
            FollowOffset = offset.Value;
        }
    }

    /// <summary>
    /// Stops following the current target.
    /// </summary>
    public void StopFollowing()
    {
        isFollowing = false;
        followTarget = null;
    }

    /// <summary>
    /// Shakes the camera for a specified duration.
    /// </summary>
    /// <param name="intensity">The intensity of the shake.</param>
    /// <param name="duration">The duration in seconds.</param>
    public void Shake(float intensity, float duration)
    {
        shakeIntensity = intensity;
        shakeDuration = duration;
        shakeTimer = 0f;
    }

    /// <summary>
    /// Instantly moves the camera to a position.
    /// </summary>
    /// <param name="x">The X position.</param>
    /// <param name="y">The Y position.</param>
    public void SnapTo(float x, float y)
    {
        position = new Vector2(x, y);
        targetPosition = position;
    }

    /// <summary>
    /// Instantly moves the camera to an entity's position.
    /// </summary>
    /// <param name="entity">The entity to snap to.</param>
    public void SnapTo(Entity entity)
    {
        if (entity != null)
        {
            SnapTo(entity.X, entity.Y);
        }
    }

    /// <summary>
    /// Resets the camera to default settings.
    /// </summary>
    public void Reset()
    {
        position = Vector2.Zero;
        targetPosition = Vector2.Zero;
        zoom = 1f;
        targetZoom = 1f;
        rotation = 0f;
        targetRotation = 0f;
        shakeOffset = Vector2.Zero;
        shakeIntensity = 0f;
        shakeDuration = 0f;
        shakeTimer = 0f;
        isFollowing = false;
        followTarget = null;
        FollowOffset = Vector2.Zero;
    }
}
