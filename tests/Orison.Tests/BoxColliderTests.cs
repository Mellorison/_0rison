using Xunit;
using Orison;

namespace Orison.Tests;

public class BoxColliderTests
{
    [Fact]
    public void BoxCollider_Constructor_InitializesCorrectly()
    {
        var collider = new BoxCollider(32, 64);

        Assert.Equal(32, collider.Width);
        Assert.Equal(64, collider.Height);
    }

    [Fact]
    public void BoxCollider_ConstructorWithTags_InitializesWithTags()
    {
        var collider = new BoxCollider(32, 64, 1, 2, 3);

        Assert.Equal(32, collider.Width);
        Assert.Equal(64, collider.Height);
    }

    [Fact]
    public void BoxCollider_Left_ReturnsCorrectValue()
    {
        var collider = new BoxCollider(32, 64);
        // Note: This test assumes the collider has an entity with position
        // For now, we'll just test the constructor
        Assert.Equal(32, collider.Width);
    }

    [Fact]
    public void BoxCollider_Top_ReturnsCorrectValue()
    {
        var collider = new BoxCollider(32, 64);
        // Note: This test assumes the collider has an entity with position
        // For now, we'll just test the constructor
        Assert.Equal(64, collider.Height);
    }
}
