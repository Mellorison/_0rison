using System;

namespace Orison {
    /// <summary>
    /// A 2D vector struct for mathematical operations.
    /// </summary>
    public struct Vector2 : IEquatable<Vector2> {
        #region Public Fields

        public float X;
        public float Y;

        #endregion

        #region Static Properties

        public static Vector2 Zero => new Vector2(0, 0);
        public static Vector2 One => new Vector2(1, 1);
        public static Vector2 UnitX => new Vector2(1, 0);
        public static Vector2 UnitY => new Vector2(0, 1);

        #endregion

        #region Constructors

        public Vector2(float x, float y) {
            X = x;
            Y = y;
        }

        public Vector2(float value) {
            X = value;
            Y = value;
        }

        #endregion

        #region Public Properties

        public float Length => (float)Math.Sqrt(X * X + Y * Y);
        public float LengthSquared => X * X + Y * Y;

        #endregion

        #region Public Methods

        public void Normalize() {
            float length = Length;
            if (length > 0) {
                X /= length;
                Y /= length;
            }
        }

        public Vector2 Normalized() {
            float length = Length;
            if (length > 0) {
                return new Vector2(X / length, Y / length);
            }
            return Zero;
        }

        public static float Distance(Vector2 a, Vector2 b) {
            float dx = a.X - b.X;
            float dy = a.Y - b.Y;
            return (float)Math.Sqrt(dx * dx + dy * dy);
        }

        public static float DistanceSquared(Vector2 a, Vector2 b) {
            float dx = a.X - b.X;
            float dy = a.Y - b.Y;
            return dx * dx + dy * dy;
        }

        public static float Dot(Vector2 a, Vector2 b) {
            return a.X * b.X + a.Y * b.Y;
        }

        public static Vector2 Lerp(Vector2 a, Vector2 b, float t) {
            return new Vector2(
                a.X + (b.X - a.X) * t,
                a.Y + (b.Y - a.Y) * t
            );
        }

        public static Vector2 Clamp(Vector2 value, Vector2 min, Vector2 max) {
            return new Vector2(
                Math.Clamp(value.X, min.X, max.X),
                Math.Clamp(value.Y, min.Y, max.Y)
            );
        }

        public static Vector2 Min(Vector2 a, Vector2 b) {
            return new Vector2(Math.Min(a.X, b.X), Math.Min(a.Y, b.Y));
        }

        public static Vector2 Max(Vector2 a, Vector2 b) {
            return new Vector2(Math.Max(a.X, b.X), Math.Max(a.Y, b.Y));
        }

        public override bool Equals(object obj) {
            return obj is Vector2 other && Equals(other);
        }

        public bool Equals(Vector2 other) {
            return X == other.X && Y == other.Y;
        }

        public override int GetHashCode() {
            return HashCode.Combine(X, Y);
        }

        public override string ToString() {
            return $"({X}, {Y})";
        }

        #endregion

        #region Operators

        public static Vector2 operator +(Vector2 a, Vector2 b) {
            return new Vector2(a.X + b.X, a.Y + b.Y);
        }

        public static Vector2 operator -(Vector2 a, Vector2 b) {
            return new Vector2(a.X - b.X, a.Y - b.Y);
        }

        public static Vector2 operator *(Vector2 a, float b) {
            return new Vector2(a.X * b, a.Y * b);
        }

        public static Vector2 operator *(float a, Vector2 b) {
            return new Vector2(a * b.X, a * b.Y);
        }

        public static Vector2 operator /(Vector2 a, float b) {
            return new Vector2(a.X / b, a.Y / b);
        }

        public static bool operator ==(Vector2 a, Vector2 b) {
            return a.Equals(b);
        }

        public static bool operator !=(Vector2 a, Vector2 b) {
            return !a.Equals(b);
        }

        #endregion
    }
}
