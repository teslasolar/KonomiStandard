// Simple search functionality using Alpine.js
// In production, this would use Lunr.js with a pre-built index

document.addEventListener('alpine:init', () => {
  Alpine.data('search', () => ({
    q: '',
    results: [],
    open: false,

    // Mock search data - in production, this would come from a generated index
    searchData: [
      { id: 'isa-95', name: 'ISA-95', type: 'Standard', url: '/standards/isa-95' },
      { id: 'isa-88', name: 'ISA-88', type: 'Standard', url: '/standards/isa-88' },
      { id: 'isa-101', name: 'ISA-101', type: 'Standard', url: '/standards/isa-101' },
      { id: 'identifier', name: 'Identifier', type: 'Base UDT', url: '/udts/identifier' },
      { id: 'timestamp', name: 'Timestamp', type: 'Base UDT', url: '/udts/timestamp' },
      { id: 'quality', name: 'Quality', type: 'Base UDT', url: '/udts/quality' },
      { id: 'value', name: 'Value', type: 'Base UDT', url: '/udts/value' }
    ],

    doSearch() {
      if (!this.q || this.q.length < 2) {
        this.results = [];
        this.open = false;
        return;
      }

      const query = this.q.toLowerCase();
      this.results = this.searchData
        .filter(item =>
          item.name.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query)
        )
        .slice(0, 5);

      this.open = this.results.length > 0;
    }
  }));
});
