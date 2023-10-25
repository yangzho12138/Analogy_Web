import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SearchHistory.css';

function SearchHistory() {
    const [searchHistory, setSearchHistory] = useState([]);

    useEffect(() => {
        // Make an API call to fetch search history data
        axios.get('/api/search/getAllSearchHistory')
            .then(response => {
                console.log("Search history data: ", response.data);
                setSearchHistory(response.data);
            })
            .catch(error => {
                console.error("Error fetching search history data: ", error);
            });
    }, []);
    const handleSubmission = (conceptId) => {
        
        // http://localhost:6000/api/search/submitSearchHistory
    };

    return (
        <div className="search-history-container">
            <div className="search-history">
                {searchHistory.map(conceptData => (
                    <div key={conceptData.userId} className="search-history-concept-row">
                        <div className="search-history-concept">{conceptData.concept}</div>
                        <div className="search-history-search-keyword">{conceptData.searchKeyword}</div>
                        <button className='search-history-submit-button'
                            onClick={() => handleSubmission(conceptData.id)}
                            disabled={conceptData.submitted}
                        >
                            {conceptData.submitted ? 'Submitted' : 'Submit'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SearchHistory;
