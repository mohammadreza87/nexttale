# Prompt Tips

Write better prompts for better games.

## The SPEC Framework

**S** - Scope: What type of game?
**P** - Player: How do they interact?
**E** - Elements: What objects exist?
**C** - Conditions: Win/lose rules?

### Example

```
Create a brick breaker game where:
- [Scope] Classic arcade-style brick breaking
- [Player] Mouse controls paddle, click to launch
- [Elements] Paddle, ball, 5 rows of colored bricks
- [Conditions] Win when all bricks broken, lose if ball falls 3 times
```

## Good vs Bad Prompts

::: danger Bad
Make a game
:::

::: tip Good
Create a Tetris clone with standard 10x20 grid, 7 tetromino shapes, arrow keys to move/rotate, score based on lines cleared
:::

## Iteration Prompts

### Bug Fixes
```
The [thing] isn't working. When I [action], it should [expected] but instead [actual].
```

### Adding Features
```
Add [feature] that [behavior] when [trigger]
```

### Visual Changes
```
Change the [element] color from [current] to [new]
```

## Common Mistakes

1. **Too much at once** - Build incrementally
2. **Too abstract** - Be specific about visuals
3. **No context** - Reference existing files
4. **No testing** - Test each change before adding more
