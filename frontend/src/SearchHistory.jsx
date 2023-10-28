import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SearchHistory.css';

function SearchHistory({onSearchRecordSelect}) {
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
                                    {/* <div className="search-history-search-keyword">{conceptData.searchKeyword}</div> */}
                                    <button
                                        key={conceptData.id}
                                        className="search-history-search-keyword"
                                        onClick={() => onSearchRecordSelect(searchHistory[concept][0].id)}
                                    >
                                        {conceptData.searchKeyword}
                                    </button>
                                </div>
                            ))}
                            <button
                                className='search-history-submit-button'
                                onClick={() => handleSubmission(searchHistory[concept][0].concept)} // Use the ID of the first record
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

// Call http://localhost:6000/api/search/getSearchHistoryDetail for every record in the search panel under a particular concept
// Provide the id to the id in the below object
// {
//     "userId": "653056d0ed8f4dd88f27bf8d",
//     "searchKeyword": "history",
//     "tag": "Self-generated",
//     "concept": "653054a671a82b9fc812b845",
//     "searchRecordIds": [
//         "653056f5ed8f4dd88f27bf95",
//         "653056f5ed8f4dd88f27bf97",
//         "653056f5ed8f4dd88f27bf99",
//         "653056f5ed8f4dd88f27bf9b",
//         "653056f5ed8f4dd88f27bf9d",
//         "653056f5ed8f4dd88f27bf9f"
//     ],
//     "submitted": false,
//     "id": "653056f5ed8f4dd88f27bf94"
// }
export default SearchHistory;
