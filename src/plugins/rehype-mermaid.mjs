<script type="module" is:inline>
  import mermaid from 'mermaid';

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'default'
  });

  const runMermaid = async () => {
    const nodes = document.querySelectorAll('.mermaid');
    if (!nodes.length) return;
    await mermaid.run({ nodes });
  };

  runMermaid();
</script>