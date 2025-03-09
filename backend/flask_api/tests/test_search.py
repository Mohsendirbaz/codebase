import pytest
from unittest.mock import Mock, patch
from ..search import (
    SearchEngine,
    SearchIndex,
    SearchQuery,
    SearchResult,
    SearchError,
    Analyzer,
    Tokenizer
)

class TestSearch:
    """Test search utilities"""

    @pytest.fixture
    def search_engine(self):
        """Create search engine instance"""
        return SearchEngine(
            config={
                'index_path': ':memory:',
                'analyzer': 'standard',
                'min_score': 0.5
            }
        )

    @pytest.fixture
    def search_index(self):
        """Create search index instance"""
        return SearchIndex(name='test_index')

    @pytest.fixture
    def analyzer(self):
        """Create text analyzer instance"""
        return Analyzer(
            tokenizer=Tokenizer(),
            filters=['lowercase', 'stop_words']
        )

    def test_document_indexing(self, search_engine):
        """Test document indexing"""
        # Add documents
        docs = [
            {
                'id': 1,
                'title': 'Python Programming',
                'content': 'Python is a versatile programming language'
            },
            {
                'id': 2,
                'title': 'Data Science',
                'content': 'Data science involves programming and statistics'
            }
        ]

        for doc in docs:
            search_engine.index_document(doc)

        # Verify indexing
        stats = search_engine.get_index_stats()
        assert stats['doc_count'] == 2
        assert stats['term_count'] > 0

    def test_search_query(self, search_engine):
        """Test search query execution"""
        # Index test documents
        search_engine.index_document({
            'id': 1,
            'title': 'Python Tutorial',
            'content': 'Learn Python programming basics'
        })
        search_engine.index_document({
            'id': 2,
            'title': 'JavaScript Guide',
            'content': 'JavaScript programming tutorial'
        })

        # Search query
        query = SearchQuery('python programming')
        results = search_engine.search(query)

        assert len(results) == 1
        assert results[0].document['id'] == 1
        assert results[0].score > 0.5

    def test_fuzzy_search(self, search_engine):
        """Test fuzzy search capabilities"""
        # Index document
        search_engine.index_document({
            'id': 1,
            'title': 'Programming Languages',
            'content': 'Python is popular'
        })

        # Search with typo
        query = SearchQuery('phyton', fuzzy=True)
        results = search_engine.search(query)

        assert len(results) == 1
        assert 'Python' in results[0].document['content']

    def test_field_boosting(self, search_engine):
        """Test field boosting in search"""
        # Index documents
        search_engine.index_document({
            'id': 1,
            'title': 'Python Guide',
            'content': 'Some content about coding'
        })
        search_engine.index_document({
            'id': 2,
            'title': 'Coding Tips',
            'content': 'Python is mentioned here'
        })

        # Search with field boosting
        query = SearchQuery('python', field_boosts={'title': 2.0})
        results = search_engine.search(query)

        assert results[0].document['id'] == 1  # Title match should rank higher

    def test_text_analysis(self, analyzer):
        """Test text analysis"""
        text = "The Quick Brown Fox Jumps!"
        
        # Analyze text
        tokens = analyzer.analyze(text)

        # Verify analysis
        assert 'quick' in tokens  # lowercase
        assert 'brown' in tokens
        assert 'the' not in tokens  # stop word removed
        assert '!' not in tokens  # punctuation removed

    def test_phrase_search(self, search_engine):
        """Test phrase search"""
        # Index documents
        search_engine.index_document({
            'id': 1,
            'content': 'machine learning algorithms'
        })
        search_engine.index_document({
            'id': 2,
            'content': 'learning machine basics'
        })

        # Search for exact phrase
        query = SearchQuery('"machine learning"', phrase=True)
        results = search_engine.search(query)

        assert len(results) == 1
        assert results[0].document['id'] == 1

    def test_search_filtering(self, search_engine):
        """Test search result filtering"""
        # Index documents
        search_engine.index_document({
            'id': 1,
            'category': 'tech',
            'rating': 4.5
        })
        search_engine.index_document({
            'id': 2,
            'category': 'tech',
            'rating': 3.0
        })

        # Search with filters
        query = SearchQuery('*', filters={
            'category': 'tech',
            'rating_gte': 4.0
        })
        results = search_engine.search(query)

        assert len(results) == 1
        assert results[0].document['rating'] >= 4.0

    def test_search_pagination(self, search_engine):
        """Test search result pagination"""
        # Index multiple documents
        for i in range(20):
            search_engine.index_document({
                'id': i,
                'content': f'Document {i}'
            })

        # Search with pagination
        query = SearchQuery('document', page=2, per_page=5)
        results = search_engine.search(query)

        assert len(results) == 5
        assert results[0].document['id'] == 5  # Second page starts at index 5

    def test_index_updates(self, search_engine):
        """Test index updates"""
        # Index document
        doc_id = 1
        search_engine.index_document({
            'id': doc_id,
            'title': 'Original Title',
            'content': 'Original content'
        })

        # Update document
        search_engine.update_document(doc_id, {
            'title': 'Updated Title',
            'content': 'Updated content'
        })

        # Search for updated content
        query = SearchQuery('updated')
        results = search_engine.search(query)

        assert len(results) == 1
        assert results[0].document['title'] == 'Updated Title'

    def test_index_deletion(self, search_engine):
        """Test document deletion from index"""
        # Index document
        doc_id = 1
        search_engine.index_document({
            'id': doc_id,
            'content': 'Test content'
        })

        # Delete document
        search_engine.delete_document(doc_id)

        # Verify deletion
        query = SearchQuery('test')
        results = search_engine.search(query)
        assert len(results) == 0

    def test_search_highlighting(self, search_engine):
        """Test search result highlighting"""
        # Index document
        search_engine.index_document({
            'id': 1,
            'content': 'Python is a great programming language'
        })

        # Search with highlighting
        query = SearchQuery('python programming', highlight=True)
        results = search_engine.search(query)

        assert '<em>Python</em>' in results[0].highlights['content']
        assert '<em>programming</em>' in results[0].highlights['content']

    def test_search_suggestions(self, search_engine):
        """Test search suggestions"""
        # Index documents for suggestion building
        docs = [
            'python programming',
            'python tutorial',
            'programming basics'
        ]
        for i, content in enumerate(docs):
            search_engine.index_document({
                'id': i + 1,
                'content': content
            })

        # Get suggestions
        suggestions = search_engine.get_suggestions('py')
        assert 'python' in suggestions

        suggestions = search_engine.get_suggestions('prog')
        assert 'programming' in suggestions

    def test_faceted_search(self, search_engine):
        """Test faceted search"""
        # Index documents with facets
        docs = [
            {'id': 1, 'category': 'tech', 'tags': ['python', 'web']},
            {'id': 2, 'category': 'tech', 'tags': ['javascript']},
            {'id': 3, 'category': 'science', 'tags': ['python', 'data']}
        ]
        for doc in docs:
            search_engine.index_document(doc)

        # Search with facets
        query = SearchQuery('python', facets=['category', 'tags'])
        results = search_engine.search(query)

        assert 'category' in results.facets
        assert results.facets['category']['tech'] == 1
        assert results.facets['tags']['python'] == 2
