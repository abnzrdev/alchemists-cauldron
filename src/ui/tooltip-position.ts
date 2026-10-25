interface Rectangle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function positionTooltip(
  card: Rectangle,
  tooltip: { width: number; height: number },
  viewport: { width: number; height: number },
) {
  const gutter = 8;
  const leftward =
    card.right + gutter + tooltip.width > viewport.width - gutter;
  const upward =
    card.bottom + tooltip.height + gutter > viewport.height - gutter;
  const beside = !leftward || card.left - tooltip.width - gutter >= gutter;
  const clamp = (value: number, extent: number, size: number) =>
    Math.max(gutter, Math.min(value, extent - size - gutter));
  return {
    left: clamp(
      leftward ? card.left - tooltip.width - gutter : card.right + gutter,
      viewport.width,
      tooltip.width,
    ),
    top: clamp(
      upward
        ? card.top - tooltip.height - gutter
        : beside
          ? card.top
          : card.bottom + gutter,
      viewport.height,
      tooltip.height,
    ),
    leftward,
    upward,
  };
}
