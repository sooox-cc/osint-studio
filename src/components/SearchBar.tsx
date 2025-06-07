import { Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  loading: boolean;
}

const SearchBar = ({ query, onQueryChange, onSearch, loading }: SearchBarProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <div className="search-input-container">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="Search nodes..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="search-input"
        />
        {loading && <Loader2 className="search-loading" size={20} />}
      </div>
      <button type="submit" className="search-button" disabled={loading}>
        Search
      </button>
    </form>
  );
};

export default SearchBar;