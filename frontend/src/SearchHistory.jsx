import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SearchHistory.css';

function SearchHistory({onSearchRecordSelect, searchHistoryUpdated}) {
    const [searchHistory, setSearchHistory] = useState([]);
    const [apiData, setApiData] = useState('');
    useEffect(() => {
        if(searchHistoryUpdated || !searchHistoryUpdated) {
        axios.get('/api/search/getAllSearchHistory')
            .then(response => {
                console.log("Search history data: ", response.data);
                setSearchHistory(response.data);
                console.log("Search history: ", searchHistory);
            })
            .catch(error => {
                console.error("Error fetching search history data: ", error);
            });
        }
    }, [searchHistoryUpdated]);
    const handleSubmission = (conceptId) => {
        const submissionData = {
            conceptId: conceptId 
        };
    
        console.log("Submission data: ", submissionData);
        axios.post('/api/search/submitSearchHistory', {conceptId:conceptId}, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then((response) => {
            if (response.status === 200) {
                alert('Data submitted successfully.');
            } else {
                alert('Data could not be submitted.');
            }
        })
        .catch((error) => {
            // Handle any errors
            console.error('Error:', error);
            alert(error.response.data);
        });
        
    };

    return (
        <div className="search-history-container">
        {Object.keys(searchHistory).length === 0 ? (
            <div>No search history</div>
        ) : (
            Object.keys(searchHistory).map(concept => (
                <div key={concept} className="concept-section">
                    <h3>{concept}</h3>
                    {searchHistory[concept].length === 0 ? (<div>No search history for {concept}</div>) : (
                        searchHistory[concept][0].submitted ? (<div>Search history for {concept} has been submitted</div>) :(
                        <div className="submit-button-section">
                            {searchHistory[concept].map(conceptData => (
                                <div key={conceptData.id} className="search-history-concept-row">
                                    <span className="search-history-custom-badge-class">{conceptData.tag}</span>
                                    <br/>
                                    <button
                                        key={conceptData.id}
                                        className="search-history-search-keyword"
                                        onClick={() => onSearchRecordSelect(conceptData.id)}
                                    >
                                        {conceptData.searchKeyword}
                                    </button>
                                </div>
                            ))}
                            <button
                                className='search-history-submit-button'
                                onClick={() => handleSubmission(searchHistory[concept][0].concept)} 
                                disabled={searchHistory[concept][0].submitted}
                            >
                                {searchHistory[concept][0].submitted ? 'Submitted' : 'Submit'}
                            </button>
                        </div>)
                    )}
                </div>
            ))
        )}
    </div>
    );
}

export default SearchHistory;