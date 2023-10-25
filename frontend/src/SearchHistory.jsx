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
                console.log("Search history: ", searchHistory);
            })
            .catch(error => {
                console.error("Error fetching search history data: ", error);
            });
    }, []);
    const handleSubmission = (conceptId) => {
        
        // http://localhost:6000/api/search/submitSearchHistory
        const submissionData = {
            conceptId: conceptId 
        };
    
        // console.log("Submission data: ", submissionData);
        axios.post('/api/search/submitSearchHistory', {conceptId:conceptId}, {
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then((response) => {
            if (response.status === 200) {
                // Handle successful submission
                alert('Data submitted successfully.');
            } else {
                // Handle submission failure
                alert('Data could not be submitted.');
            }
        })
        .catch((error) => {
            // Handle any errors
            console.error('Error:', error);
            alert('An error occurred while submitting data.');
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
                    {searchHistory[concept].length === 0 ? (
                        <div>No search history for this concept</div>
                    ) : (
                        <div className="submit-button-section">
                            {searchHistory[concept].map(conceptData => (
                                <div key={conceptData.id} className="search-history-concept-row">
                                    <div className="search-history-concept">{conceptData.concept}</div>
                                    <div className="search-history-search-keyword">{conceptData.searchKeyword}</div>
                                </div>
                            ))}
                            <button
                                className='search-history-submit-button'
                                onClick={() => handleSubmission(searchHistory[concept][0].id)} // Use the ID of the first record
                                disabled={searchHistory[concept][0].submitted}
                            >
                                {searchHistory[concept][0].submitted ? 'Submitted' : 'Submit'}
                            </button>
                        </div>
                    )}
                </div>
            ))
        )}
    </div>
    );
}

export default SearchHistory;
