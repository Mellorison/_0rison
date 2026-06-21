/**
 * Audio manager for ambient sounds and music.
 * Uses Web Audio API for spatial audio and background music.
 */
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientSources: Map<string, AudioBufferSourceNode> = new Map();
  private musicSource: AudioBufferSourceNode | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Audio context will be created on user interaction
  }

  /**
   * Initializes the audio system (must be called on user interaction).
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.audioContext.destination);

      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = 0.4;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.isInitialized = true;
      console.log('Audio manager initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  /**
   * Plays ambient sound (looping).
   * @param name Name identifier for the sound.
   * @param frequency Frequency for procedural generation (if no buffer provided).
   * @param type Oscillator type for procedural generation.
   */
  playAmbient(name: string, frequency: number = 440, type: OscillatorType = 'sine'): void {
    if (!this.audioContext || !this.isInitialized) return;

    // Stop existing ambient with same name
    this.stopAmbient(name);

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.1;

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain!);

    oscillator.start();
    this.ambientSources.set(name, oscillator as any);
  }

  /**
   * Stops an ambient sound.
   */
  stopAmbient(name: string): void {
    const source = this.ambientSources.get(name);
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
      this.ambientSources.delete(name);
    }
  }

  /**
   * Plays background music (looping).
   * @param buffer Audio buffer for the music.
   */
  playMusic(buffer: AudioBuffer): void {
    if (!this.audioContext || !this.isInitialized) return;

    // Stop existing music
    this.stopMusic();

    this.musicBuffer = buffer;
    this.musicSource = this.audioContext.createBufferSource();
    this.musicSource.buffer = buffer;
    this.musicSource.loop = true;
    this.musicSource.connect(this.musicGain!);
    this.musicSource.start();
  }

  /**
   * Stops background music.
   */
  stopMusic(): void {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
      } catch (e) {
        // Already stopped
      }
      this.musicSource = null;
    }
  }

  /**
   * Plays a sound effect.
   * @param frequency Frequency for procedural generation.
   * @param duration Duration in seconds.
   * @param type Oscillator type.
   */
  playSFX(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioContext || !this.isInitialized) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain!);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Plays a footstep sound.
   */
  playFootstep(): void {
    // Randomize slightly for variety
    const frequency = 100 + Math.random() * 50;
    this.playSFX(frequency, 0.1, 'triangle');
  }

  /**
   * Plays a jump sound.
   */
  playJump(): void {
    const oscillator = this.audioContext?.createOscillator();
    const gainNode = this.audioContext?.createGain();

    if (!oscillator || !gainNode || !this.audioContext) return;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain!);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  /**
   * Sets the master volume.
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Sets the music volume.
   */
  setMusicVolume(volume: number): void {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Sets the SFX volume.
   */
  setSFXVolume(volume: number): void {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Resumes the audio context if suspended.
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Disposes of audio resources.
   */
  dispose(): void {
    this.stopMusic();
    for (const [name] of this.ambientSources) {
      this.stopAmbient(name);
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }

  /**
   * Gets whether the audio manager is initialized.
   */
  get IsInitialized(): boolean {
    return this.isInitialized;
  }
}
