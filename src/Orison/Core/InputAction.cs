using System;
using System.Collections.Generic;

namespace Orison;

/// <summary>
/// Represents a mapped input action that can be triggered by multiple input sources.
/// Allows for customizable input mapping and rebinding.
/// </summary>
public class InputAction
{
    private string name;
    private List<Key> keys;
    private List<MouseButton> mouseButtons;
    private List<GamepadButton> gamepadButtons;
    private List<int> gamepadAxes;
    private float deadzone = 0.1f;

    /// <summary>
    /// The name of this input action.
    /// </summary>
    public string Name
    {
        get { return name; }
        set { name = value; }
    }

    /// <summary>
    /// Whether this action was pressed this frame.
    /// </summary>
    public bool Pressed { get; private set; }

    /// <summary>
    /// Whether this action is currently held down.
    /// </summary>
    public bool Held { get; private set; }

    /// <summary>
    /// Whether this action was released this frame.
    /// </summary>
    public bool Released { get; private set; }

    /// <summary>
    /// The analog value of this action (for axes, 0-1 or -1 to 1).
    /// </summary>
    public float Value { get; private set; }

    /// <summary>
    /// The deadzone threshold for analog inputs.
    /// </summary>
    public float Deadzone
    {
        get { return deadzone; }
        set { deadzone = Math.Clamp(value, 0f, 1f); }
    }

    public InputAction(string name)
    {
        this.name = name;
        keys = new List<Key>();
        mouseButtons = new List<MouseButton>();
        gamepadButtons = new List<GamepadButton>();
        gamepadAxes = new List<int>();
    }

    /// <summary>
    /// Adds a keyboard key binding to this action.
    /// </summary>
    /// <param name="key">The key to bind.</param>
    public void AddKey(Key key)
    {
        if (!keys.Contains(key))
        {
            keys.Add(key);
        }
    }

    /// <summary>
    /// Adds a mouse button binding to this action.
    /// </summary>
    /// <param name="button">The mouse button to bind.</param>
    public void AddMouseButton(MouseButton button)
    {
        if (!mouseButtons.Contains(button))
        {
            mouseButtons.Add(button);
        }
    }

    /// <summary>
    /// Adds a gamepad button binding to this action.
    /// </summary>
    /// <param name="button">The gamepad button to bind.</param>
    public void AddGamepadButton(GamepadButton button)
    {
        if (!gamepadButtons.Contains(button))
        {
            gamepadButtons.Add(button);
        }
    }

    /// <summary>
    /// Adds a gamepad axis binding to this action.
    /// </summary>
    /// <param name="axis">The gamepad axis index.</param>
    public void AddGamepadAxis(int axis)
    {
        if (!gamepadAxes.Contains(axis))
        {
            gamepadAxes.Add(axis);
        }
    }

    /// <summary>
    /// Removes a keyboard key binding.
    /// </summary>
    /// <param name="key">The key to unbind.</param>
    public void RemoveKey(Key key)
    {
        keys.Remove(key);
    }

    /// <summary>
    /// Removes a mouse button binding.
    /// </summary>
    /// <param name="button">The mouse button to unbind.</param>
    public void RemoveMouseButton(MouseButton button)
    {
        mouseButtons.Remove(button);
    }

    /// <summary>
    /// Removes a gamepad button binding.
    /// </summary>
    /// <param name="button">The gamepad button to unbind.</param>
    public void RemoveGamepadButton(GamepadButton button)
    {
        gamepadButtons.Remove(button);
    }

    /// <summary>
    /// Removes a gamepad axis binding.
    /// </summary>
    /// <param name="axis">The gamepad axis to unbind.</param>
    public void RemoveGamepadAxis(int axis)
    {
        gamepadAxes.Remove(axis);
    }

    /// <summary>
    /// Clears all bindings for this action.
    /// </summary>
    public void ClearBindings()
    {
        keys.Clear();
        mouseButtons.Clear();
        gamepadButtons.Clear();
        gamepadAxes.Clear();
    }

    /// <summary>
    /// Updates the state of this input action. Should be called every frame.
    /// </summary>
    public void Update()
    {
        bool wasHeld = Held;
        Pressed = false;
        Held = false;
        Released = false;
        Value = 0f;

        // Check keyboard keys
        foreach (var key in keys)
        {
            if (Input.Keyboard.Check(key))
            {
                Held = true;
                Value = 1f;
                if (!wasHeld)
                {
                    Pressed = true;
                }
                break;
            }
        }

        // Check mouse buttons
        if (!Held)
        {
            foreach (var button in mouseButtons)
            {
                if (Input.Mouse.Check(button))
                {
                    Held = true;
                    Value = 1f;
                    if (!wasHeld)
                    {
                        Pressed = true;
                    }
                    break;
                }
            }
        }

        // Check gamepad buttons
        if (!Held)
        {
            foreach (var button in gamepadButtons)
            {
                if (Input.Gamepad.Check(0, button))
                {
                    Held = true;
                    Value = 1f;
                    if (!wasHeld)
                    {
                        Pressed = true;
                    }
                    break;
                }
            }
        }

        // Check gamepad axes
        if (!Held && gamepadAxes.Count > 0)
        {
            float axisValue = 0f;
            foreach (var axis in gamepadAxes)
            {
                float val = Input.Gamepad.Axis(0, axis);
                if (Math.Abs(val) > Math.Abs(axisValue))
                {
                    axisValue = val;
                }
            }

            if (Math.Abs(axisValue) > deadzone)
            {
                Held = true;
                Value = axisValue;
                if (!wasHeld)
                {
                    Pressed = true;
                }
            }
        }

        // Check for release
        if (wasHeld && !Held)
        {
            Released = true;
        }
    }
}

/// <summary>
/// Manages a collection of input actions for easy input mapping.
/// </summary>
public class InputActionManager
{
    private Dictionary<string, InputAction> actions;

    public InputActionManager()
    {
        actions = new Dictionary<string, InputAction>();
    }

    /// <summary>
    /// Creates a new input action with the specified name.
    /// </summary>
    /// <param name="name">The name of the action.</param>
    /// <returns>The created input action.</returns>
    public InputAction CreateAction(string name)
    {
        if (actions.ContainsKey(name))
        {
            return actions[name];
        }

        var action = new InputAction(name);
        actions[name] = action;
        return action;
    }

    /// <summary>
    /// Gets an input action by name.
    /// </summary>
    /// <param name="name">The name of the action.</param>
    /// <returns>The input action, or null if not found.</returns>
    public InputAction GetAction(string name)
    {
        if (actions.ContainsKey(name))
        {
            return actions[name];
        }
        return null;
    }

    /// <summary>
    /// Updates all input actions. Should be called every frame.
    /// </summary>
    public void Update()
    {
        foreach (var action in actions.Values)
        {
            action.Update();
        }
    }

    /// <summary>
    /// Removes an input action.
    /// </summary>
    /// <param name="name">The name of the action to remove.</param>
    public void RemoveAction(string name)
    {
        actions.Remove(name);
    }

    /// <summary>
    /// Clears all input actions.
    /// </summary>
    public void Clear()
    {
        actions.Clear();
    }
}
