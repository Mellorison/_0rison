/**
 * Messenger-style start screen with character customization.
 */
export class StartScreen {
  private container: HTMLDivElement;
  private onStart: (name: string, customization: CharacterCustomization) => void;
  private customization: CharacterCustomization = {
    hairColor: '#2d1810',
    skinColor: '#ffdbac',
    shirtColor: '#5a9fd4',
    pantsColor: '#4a3728',
    shoeColor: '#333333'
  };

  constructor(onStart: (name: string, customization: CharacterCustomization) => void) {
    this.onStart = onStart;
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, #87CEEB 0%, #E8D5B7 50%, #C2B280 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    this.render();
    document.body.appendChild(this.container);
  }

  private render(): void {
    this.container.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 40px;">
        <h1 style="
          font-size: 56px;
          color: #2c3e50;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          letter-spacing: 4px;
        ">MESSENGER</h1>
        <p style="
          font-size: 18px;
          color: #555;
          margin-bottom: 40px;
        ">Deliver letters across a tiny planet</p>
        
        <div style="background: rgba(255,255,255,0.9); padding: 30px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
          <input type="text" id="playerName" placeholder="Your name" style="
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
            box-sizing: border-box;
            text-align: center;
            outline: none;
          " onfocus="this.style.border='2px solid #3498db'; this.style.boxShadow='0 0 8px rgba(52, 152, 219, 0.5)';" onblur="this.style.border='2px solid #ddd'; this.style.boxShadow='none';" value="Messenger">
          
          <div style="margin-bottom: 20px;">
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Customize your character</p>
            <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
              <div style="text-align: center;">
                <label style="font-size: 11px; color: #888;">Hair</label>
                <input type="color" id="hairColor" value="${this.customization.hairColor}" style="width: 40px; height: 40px; border: none; border-radius: 50%; cursor: pointer;">
              </div>
              <div style="text-align: center;">
                <label style="font-size: 11px; color: #888;">Skin</label>
                <input type="color" id="skinColor" value="${this.customization.skinColor}" style="width: 40px; height: 40px; border: none; border-radius: 50%; cursor: pointer;">
              </div>
              <div style="text-align: center;">
                <label style="font-size: 11px; color: #888;">Shirt</label>
                <input type="color" id="shirtColor" value="${this.customization.shirtColor}" style="width: 40px; height: 40px; border: none; border-radius: 50%; cursor: pointer;">
              </div>
              <div style="text-align: center;">
                <label style="font-size: 11px; color: #888;">Pants</label>
                <input type="color" id="pantsColor" value="${this.customization.pantsColor}" style="width: 40px; height: 40px; border: none; border-radius: 50%; cursor: pointer;">
              </div>
              <div style="text-align: center;">
                <label style="font-size: 11px; color: #888;">Shoes</label>
                <input type="color" id="shoeColor" value="${this.customization.shoeColor}" style="width: 40px; height: 40px; border: none; border-radius: 50%; cursor: pointer;">
              </div>
            </div>
          </div>
          
          <button id="startBtn" style="
            width: 100%;
            padding: 14px;
            font-size: 18px;
            font-weight: bold;
            color: white;
            background: #e74c3c;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s, background 0.2s;
            outline: none;
          " onfocus="this.style.outline='3px solid #3498db'; this.style.outlineOffset='2px';" onblur="this.style.outline='none';">START DELIVERING</button>
          
          <div style="margin-top: 20px; display: flex; gap: 20px; justify-content: center;">
            <span style="font-size: 13px; color: #888;">WASD / Arrow Keys to move</span>
            <span style="font-size: 13px; color: #888;">Space to jump</span>
            <span style="font-size: 13px; color: #888;">Shift to sprint</span>
          </div>
        </div>
        
        <p style="margin-top: 20px; font-size: 12px; color: #777;">
          A free browser adventure game
        </p>
      </div>
    `;

    const startBtn = this.container.querySelector('#startBtn') as HTMLButtonElement;
    startBtn.addEventListener('click', () => this.startGame());
    startBtn.addEventListener('mouseenter', () => {
      startBtn.style.transform = 'scale(1.02)';
      startBtn.style.background = '#c0392b';
    });
    startBtn.addEventListener('mouseleave', () => {
      startBtn.style.transform = 'scale(1)';
      startBtn.style.background = '#e74c3c';
    });
  }

  private startGame(): void {
    const nameInput = this.container.querySelector('#playerName') as HTMLInputElement;
    const name = nameInput.value.trim() || 'Messenger';

    this.customization = {
      hairColor: (this.container.querySelector('#hairColor') as HTMLInputElement).value,
      skinColor: (this.container.querySelector('#skinColor') as HTMLInputElement).value,
      shirtColor: (this.container.querySelector('#shirtColor') as HTMLInputElement).value,
      pantsColor: (this.container.querySelector('#pantsColor') as HTMLInputElement).value,
      shoeColor: (this.container.querySelector('#shoeColor') as HTMLInputElement).value,
    };

    this.hide();
    this.onStart(name, this.customization);
  }

  hide(): void {
    this.container.style.opacity = '0';
    this.container.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      this.container.remove();
    }, 500);
  }

  show(): void {
    document.body.appendChild(this.container);
    this.container.style.opacity = '1';
  }
}

export interface CharacterCustomization {
  hairColor: string;
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  shoeColor: string;
}
