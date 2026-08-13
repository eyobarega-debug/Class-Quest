async function runCode() {
    setRunning(true);

    try {
      const response = await api.runCode({
        slug: challenge.slug,
        language,
        source_code: code,
      });

      setResult(response);
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setRunning(false);
    }
  }

  async function submitCode() {
    setRunning(true);

    try {
      const response = await api.submitCode({
        slug: challenge.slug,
        language,
        source_code: code,
      });

      setResult(response);
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setRunning(false);
    }
  }