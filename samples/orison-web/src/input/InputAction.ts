/**
 * Represents a single input binding (key, mouse button, gamepad button, or axis).
 */
export class InputBinding {
  type: 'key' | 'mouse' | 'gamepadButton' | 'gamepadAxis';
  code?: string; // For keyboard (e.g., 'KeyW')
  button?: number; // For mouse/gamepad button
  axis?: number; // For gamepad axis
  gamepadIndex: number = 0;
  deadzone: number = 0.1;

  constructor(type: 'key' | 'mouse' | 'gamepadButton' | 'gamepadAxis', options: {
    code?: string;
    button?: number;
    axis?: number;
    gamepadIndex?: number;
    deadzone?: number;
  } = {}) {
    this.type = type;
    this.code = options.code;
    this.button = options.button;
    this.axis = options.axis;
    this.gamepadIndex = options.gamepadIndex ?? 0;
    this.deadzone = options.deadzone ?? 0.1;
  }
}

/**
 * Represents a named input action with multiple bindings.
 */
export class InputAction {
  private name: string;
  private bindings: InputBinding[] = [];
  private pressed: boolean = false;
  private held: boolean = false;
  private released: boolean = false;
  private value: number = 0;
  private previousValue: number = 0;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Gets the name of this action.
   */
  get Name(): string {
    return this.name;
  }

  /**
   * Whether the action was pressed this frame.
   */
  get Pressed(): boolean {
    return this.pressed;
  }

  /**
   * Whether the action is currently held down.
   */
  get Held(): boolean {
    return this.held;
  }

  /**
   * Whether the action was released this frame.
   */
  get Released(): boolean {
    return this.released;
  }

  /**
   * The analog value of the action (-1 to 1 for axes, 0 to 1 for buttons).
   */
  get Value(): number {
    return this.value;
  }

  /**
   * Adds a keyboard binding.
   */
  addKey(code: string): this {
    this.bindings.push(new InputBinding('key', { code }));
    return this;
  }

  /**
   * Adds a mouse button binding.
   */
  addMouseButton(button: number): this {
    this.bindings.push(new InputBinding('mouse', { button }));
    return this;
  }

  /**
   * Adds a gamepad button binding.
   */
  addGamepadButton(button: number, gamepadIndex: number = 0): this {
    this.bindings.push(new InputBinding('gamepadButton', { button, gamepadIndex }));
    return this;
  }

  /**
   * Adds a gamepad axis binding.
   */
  addGamepadAxis(axis: number, gamepadIndex: number = 0, deadzone: number = 0.1): this {
    this.bindings.push(new InputBinding('gamepadAxis', { axis, gamepadIndex, deadzone }));
    return this;
  }

  /**
   * Updates the action state.
   */
  update(inputState: InputState): void {
    this.previousValue = this.value;
    this.pressed = false;
    this.released = false;
    this.value = 0;

    for (const binding of this.bindings) {
      const bindingValue = this.getBindingValue(binding, inputState);
      
      if (bindingValue > 0) {
        this.value = Math.max(this.value, bindingValue);
      }
    }

    const wasHeld = this.held;
    this.held = this.value > 0;

    if (this.held && !wasHeld) {
      this.pressed = true;
    } else if (!this.held && wasHeld) {
      this.released = true;
    }
  }

  private getBindingValue(binding: InputBinding, inputState: InputState): number {
    switch (binding.type) {
      case 'key':
        return inputState.keys[binding.code || ''] ? 1 : 0;
      
      case 'mouse':
        return inputState.mouseButtons[binding.button || 0] ? 1 : 0;
      
      case 'gamepadButton':
        const gamepad = inputState.gamepads[binding.gamepadIndex];
        if (gamepad && binding.button !== undefined) {
          return gamepad.buttons[binding.button]?.pressed ? 1 : 0;
        }
        return 0;
      
      case 'gamepadAxis':
        const axisGamepad = inputState.gamepads[binding.gamepadIndex];
        if (axisGamepad && binding.axis !== undefined) {
          const axisValue = axisGamepad.axes[binding.axis] || 0;
          return Math.abs(axisValue) > binding.deadzone ? axisValue : 0;
        }
        return 0;
      
      default:
        return 0;
    }
  }
}

/**
 * Represents the current input state.
 */
export interface InputState {
  keys: Record<string, boolean>;
  mouseButtons: Record<number, boolean>;
  mouseX: number;
  mouseY: number;
  mouseDeltaX: number;
  mouseDeltaY: number;
  gamepads: Gamepad[];
}

/**
 * Manages input actions and updates their state.
 */
export class InputActionManager {
  private actions: Map<string, InputAction> = new Map();
  private inputState: InputState = {
    keys: {},
    mouseButtons: {},
    mouseX: 0,
    mouseY: 0,
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    gamepads: [],
  };
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;

  /**
   * Creates a new input action.
   */
  createAction(name: string): InputAction {
    const action = new InputAction(name);
    this.actions.set(name, action);
    return action;
  }

  /**
   * Gets an existing action by name.
   */
  getAction(name: string): InputAction | null {
    return this.actions.get(name) || null;
  }

  /**
   * Removes an action.
   */
  removeAction(name: string): void {
    this.actions.delete(name);
  }

  /**
   * Updates all actions.
   */
  update(): void {
    // Update gamepads
    this.inputState.gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(g => g !== null) as Gamepad[] : [];

    // Update all actions
    for (const action of this.actions.values()) {
      action.update(this.inputState);
    }

    // Reset mouse delta
    this.inputState.mouseDeltaX = 0;
    this.inputState.mouseDeltaY = 0;
  }

  /**
   * Gets the current input state.
   */
  get InputState(): InputState {
    return this.inputState;
  }

  /**
   * Handles keyboard events.
   */
  handleKeyDown(code: string): void {
    this.inputState.keys[code] = true;
  }

  handleKeyUp(code: string): void {
    this.inputState.keys[code] = false;
  }

  /**
   * Handles mouse events.
   */
  handleMouseDown(button: number): void {
    this.inputState.mouseButtons[button] = true;
  }

  handleMouseUp(button: number): void {
    this.inputState.mouseButtons[button] = false;
  }

  handleMouseMove(x: number, y: number): void {
    this.inputState.mouseX = x;
    this.inputState.mouseY = y;
    this.inputState.mouseDeltaX = x - this.previousMouseX;
    this.inputState.mouseDeltaY = y - this.previousMouseY;
    this.previousMouseX = x;
    this.previousMouseY = y;
  }

  /**
   * Sets up event listeners.
   */
  setupEventListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e.code));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e.code));
    window.addEventListener('mousedown', (e) => this.handleMouseDown(e.button));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e.button));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e.clientX, e.clientY));
  }

  /**
   * Removes event listeners.
   */
  removeEventListeners(): void {
    window.removeEventListener('keydown', (e) => this.handleKeyDown(e.code));
    window.removeEventListener('keyup', (e) => this.handleKeyUp(e.code));
    window.removeEventListener('mousedown', (e) => this.handleMouseDown(e.button));
    window.removeEventListener('mouseup', (e) => this.handleMouseUp(e.button));
    window.removeEventListener('mousemove', (e) => this.handleMouseMove(e.clientX, e.clientY));
  }
}
