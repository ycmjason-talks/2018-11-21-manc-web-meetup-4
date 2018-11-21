export default ($node, $target) => {
  $target.replaceWith($node);
  return $node;
};
