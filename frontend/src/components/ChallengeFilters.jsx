export default function ChallengeFilters({
  filters,
  setFilters,
}) {
  function update(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <input
        value={filters.search}
        onChange={(e) =>
          update("search", e.target.value)
        }
        placeholder="Search challenges..."
        className="input md:col-span-2"
      />

      <select
        value={filters.language}
        onChange={(e) =>
          update("language", e.target.value)
        }
        className="input"
      >
        <option value="">All Languages</option>
        <option value="javascript">JavaScript</option>
        <option value="cpp">C++</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
      </select>

      <select
        value={filters.difficulty}
        onChange={(e) =>
          update("difficulty", e.target.value)
        }
        className="input"
      >
        <option value="">All Difficulties</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
        <option value="expert">Expert</option>
      </select>
    </div>
  );
}
