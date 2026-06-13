using Xunit;
using Orison;

namespace Orison.Tests;

public class Vector2Tests
{
    [Fact]
    public void Vector2_Constructor_InitializesCorrectly()
    {
        var vector = new Vector2(3.0f, 4.0f);

        Assert.Equal(3.0f, vector.X);
        Assert.Equal(4.0f, vector.Y);
    }

    [Fact]
    public void Vector2_Zero_ReturnsZeroVector()
    {
        var zero = Vector2.Zero;

        Assert.Equal(0.0f, zero.X);
        Assert.Equal(0.0f, zero.Y);
    }

    [Fact]
    public void Vector2_One_ReturnsUnitVector()
    {
        var one = Vector2.One;

        Assert.Equal(1.0f, one.X);
        Assert.Equal(1.0f, one.Y);
    }

    [Fact]
    public void Vector2_Add_ReturnsCorrectSum()
    {
        var v1 = new Vector2(1.0f, 2.0f);
        var v2 = new Vector2(3.0f, 4.0f);

        var result = Vector2.Add(v1, v2);

        Assert.Equal(4.0f, result.X);
        Assert.Equal(6.0f, result.Y);
    }

    [Fact]
    public void Vector2_Subtract_ReturnsCorrectDifference()
    {
        var v1 = new Vector2(5.0f, 7.0f);
        var v2 = new Vector2(2.0f, 3.0f);

        var result = Vector2.Subtract(v1, v2);

        Assert.Equal(3.0f, result.X);
        Assert.Equal(4.0f, result.Y);
    }

    [Fact]
    public void Vector2_Multiply_ReturnsCorrectProduct()
    {
        var v1 = new Vector2(2.0f, 3.0f);
        var v2 = new Vector2(4.0f, 5.0f);

        var result = Vector2.Multiply(v1, v2);

        Assert.Equal(8.0f, result.X);
        Assert.Equal(15.0f, result.Y);
    }

    [Fact]
    public void Vector2_MultiplyScalar_ReturnsCorrectProduct()
    {
        var v1 = new Vector2(2.0f, 3.0f);

        var result = Vector2.Multiply(v1, 5.0f);

        Assert.Equal(10.0f, result.X);
        Assert.Equal(15.0f, result.Y);
    }

    [Fact]
    public void Vector2_Divide_ReturnsCorrectQuotient()
    {
        var v1 = new Vector2(10.0f, 20.0f);
        var v2 = new Vector2(2.0f, 4.0f);

        var result = Vector2.Divide(v1, v2);

        Assert.Equal(5.0f, result.X);
        Assert.Equal(5.0f, result.Y);
    }

    [Fact]
    public void Vector2_Distance_ReturnsCorrectDistance()
    {
        var v1 = new Vector2(0.0f, 0.0f);
        var v2 = new Vector2(3.0f, 4.0f);

        var distance = Vector2.Distance(v1, v2);

        Assert.Equal(5.0f, distance, 3);
    }

    [Fact]
    public void Vector2_DistanceSquared_ReturnsCorrectSquaredDistance()
    {
        var v1 = new Vector2(0.0f, 0.0f);
        var v2 = new Vector2(3.0f, 4.0f);

        var distanceSquared = Vector2.DistanceSquared(v1, v2);

        Assert.Equal(25.0f, distanceSquared);
    }

    [Fact]
    public void Vector2_Dot_ReturnsCorrectDotProduct()
    {
        var v1 = new Vector2(1.0f, 2.0f);
        var v2 = new Vector2(3.0f, 4.0f);

        var dot = Vector2.Dot(v1, v2);

        Assert.Equal(11.0f, dot);
    }

    [Fact]
    public void Vector2_Length_ReturnsCorrectLength()
    {
        var vector = new Vector2(3.0f, 4.0f);

        var length = vector.Length;

        Assert.Equal(5.0f, length, 3);
    }

    [Fact]
    public void Vector2_LengthSquared_ReturnsCorrectSquaredLength()
    {
        var vector = new Vector2(3.0f, 4.0f);

        var lengthSquared = vector.LengthSquared();

        Assert.Equal(25.0f, lengthSquared);
    }

    [Fact]
    public void Vector2_Normalize_ReturnsUnitVector()
    {
        var vector = new Vector2(3.0f, 4.0f);

        var normalized = vector.Normalized();

        Assert.Equal(0.6f, normalized.X, 3);
        Assert.Equal(0.8f, normalized.Y, 3);
        Assert.Equal(1.0f, normalized.Length, 3);
    }

    [Fact]
    public void Vector2_Lerp_ReturnsInterpolatedValue()
    {
        var v1 = new Vector2(0.0f, 0.0f);
        var v2 = new Vector2(10.0f, 20.0f);

        var result = Vector2.Lerp(v1, v2, 0.5f);

        Assert.Equal(5.0f, result.X);
        Assert.Equal(10.0f, result.Y);
    }

    [Fact]
    public void Vector2_Clamp_ReturnsClampedValue()
    {
        var value = new Vector2(5.0f, 15.0f);
        var min = new Vector2(0.0f, 10.0f);
        var max = new Vector2(10.0f, 20.0f);

        var result = Vector2.Clamp(value, min, max);

        Assert.Equal(5.0f, result.X);
        Assert.Equal(15.0f, result.Y);
    }

    [Fact]
    public void Vector2_Min_ReturnsMinimum()
    {
        var v1 = new Vector2(5.0f, 15.0f);
        var v2 = new Vector2(10.0f, 10.0f);

        var result = Vector2.Min(v1, v2);

        Assert.Equal(5.0f, result.X);
        Assert.Equal(10.0f, result.Y);
    }

    [Fact]
    public void Vector2_Max_ReturnsMaximum()
    {
        var v1 = new Vector2(5.0f, 15.0f);
        var v2 = new Vector2(10.0f, 10.0f);

        var result = Vector2.Max(v1, v2);

        Assert.Equal(10.0f, result.X);
        Assert.Equal(15.0f, result.Y);
    }

    [Fact]
    public void Vector2_Equals_ReturnsTrueForEqualVectors()
    {
        var v1 = new Vector2(3.0f, 4.0f);
        var v2 = new Vector2(3.0f, 4.0f);

        Assert.True(v1.Equals(v2));
        Assert.True(v1 == v2);
    }

    [Fact]
    public void Vector2_Equals_ReturnsFalseForDifferentVectors()
    {
        var v1 = new Vector2(3.0f, 4.0f);
        var v2 = new Vector2(4.0f, 5.0f);

        Assert.False(v1.Equals(v2));
        Assert.True(v1 != v2);
    }
}
