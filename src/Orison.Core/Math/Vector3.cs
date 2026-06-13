using System;

namespace Orison {
    /// <summary>
    /// A 3D vector struct for mathematical operations.
    /// </summary>
    public struct Vector3 : IEquatable<Vector3> {
        #region Public Fields

        public float X;
        public float Y;
        public float Z;

        #endregion

        #region Static Properties

        public static Vector3 Zero => new Vector3(0, 0, 0);
        public static Vector3 One => new Vector3(1, 1, 1);
        public static Vector3 UnitX => new Vector3(1, 0, 0);
        public static Vector3 UnitY => new Vector3(0, 1, 0);
        public static Vector3 UnitZ => new Vector3(0, 0, 1);
        public static Vector3 Up => new Vector3(0, 1, 0);
        public static Vector3 Down => new Vector3(0, -1, 0);
        public static Vector3 Left => new Vector3(-1, 0, 0);
        public static Vector3 Right => new Vector3(1, 0, 0);
        public static Vector3 Forward => new Vector3(0, 0, -1);
        public static Vector3 Back => new Vector3(0, 0, 1);

        #endregion

        #region Constructors

        public Vector3(float x, float y, float z) {
            X = x;
            Y = y;
            Z = z;
        }

        public Vector3(float value) {
            X = value;
            Y = value;
            Z = value;
        }

        public Vector3(Vector2 vector, float z) {
            X = vector.X;
            Y = vector.Y;
            Z = z;
        }

        #endregion

        #region Public Properties

        public float Length => (float)Math.Sqrt(X * X + Y * Y + Z * Z);
        public float LengthSquared => X * X + Y * Y + Z * Z;

        #endregion

        #region Public Methods

        public void Normalize() {
            float length = Length;
            if (length > 0) {
                X /= length;
                Y /= length;
                Z /= length;
            }
        }

        public Vector3 Normalized() {
            float length = Length;
            if (length > 0) {
                return new Vector3(X / length, Y / length, Z / length);
            }
            return Zero;
        }

        public static float Distance(Vector3 a, Vector3 b) {
            float dx = a.X - b.X;
            float dy = a.Y - b.Y;
            float dz = a.Z - b.Z;
            return (float)Math.Sqrt(dx * dx + dy * dy + dz * dz);
        }

        public static float DistanceSquared(Vector3 a, Vector3 b) {
            float dx = a.X - b.X;
            float dy = a.Y - b.Y;
            float dz = a.Z - b.Z;
            return dx * dx + dy * dy + dz * dz;
        }

        public static float Dot(Vector3 a, Vector3 b) {
            return a.X * b.X + a.Y * b.Y + a.Z * b.Z;
        }

        public static Vector3 Cross(Vector3 a, Vector3 b) {
            return new Vector3(
                a.Y * b.Z - a.Z * b.Y,
                a.Z * b.X - a.X * b.Z,
                a.X * b.Y - a.Y * b.X
            );
        }

        public static Vector3 Lerp(Vector3 a, Vector3 b, float t) {
            return new Vector3(
                a.X + (b.X - a.X) * t,
                a.Y + (b.Y - a.Y) * t,
                a.Z + (b.Z - a.Z) * t
            );
        }

        public static Vector3 Clamp(Vector3 value, Vector3 min, Vector3 max) {
            return new Vector3(
                Math.Clamp(value.X, min.X, max.X),
                Math.Clamp(value.Y, min.Y, max.Y),
                Math.Clamp(value.Z, min.Z, max.Z)
            );
        }

        public static Vector3 Min(Vector3 a, Vector3 b) {
            return new Vector3(Math.Min(a.X, b.X), Math.Min(a.Y, b.Y), Math.Min(a.Z, b.Z));
        }

        public static Vector3 Max(Vector3 a, Vector3 b) {
            return new Vector3(Math.Max(a.X, b.X), Math.Max(a.Y, b.Y), Math.Max(a.Z, b.Z));
        }

        public override bool Equals(object obj) {
            return obj is Vector3 other && Equals(other);
        }

        public bool Equals(Vector3 other) {
            return X == other.X && Y == other.Y && Z == other.Z;
        }

        public override int GetHashCode() {
            return HashCode.Combine(X, Y, Z);
        }

        public override string ToString() {
            return $"({X}, {Y}, {Z})";
        }

        #endregion

        #region Operators

        public static Vector3 operator +(Vector3 a, Vector3 b) {
            return new Vector3(a.X + b.X, a.Y + b.Y, a.Z + b.Z);
        }

        public static Vector3 operator -(Vector3 a, Vector3 b) {
            return new Vector3(a.X - b.X, a.Y - b.Y, a.Z - b.Z);
        }

        public static Vector3 operator *(Vector3 a, float b) {
            return new Vector3(a.X * b, a.Y * b, a.Z * b);
        }

        public static Vector3 operator *(float a, Vector3 b) {
            return new Vector3(a * b.X, a * b.Y, a * b.Z);
        }

        public static Vector3 operator /(Vector3 a, float b) {
            return new Vector3(a.X / b, a.Y / b, a.Z / b);
        }

        public static bool operator ==(Vector3 a, Vector3 b) {
            return a.Equals(b);
        }

        public static bool operator !=(Vector3 a, Vector3 b) {
            return !a.Equals(b);
        }

        #endregion
    }
}
