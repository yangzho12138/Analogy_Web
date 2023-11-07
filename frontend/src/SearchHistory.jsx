import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SearchHistory.css';
import Badge from 'react-bootstrap/Badge';


function SearchHistory({onSearchRecordSelect, searchHistoryUpdated}) {
    const [searchHistory, setSearchHistory] = useState([]);
    const [apiData, setApiData] = useState('');
    useEffect(() => {
        // Make an API call to fetch search history data
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
            alert(error.response.data);
        });
        
    };
    
    const fetchData = async(searchRecordId) => {
        axios
        .get(`/api/search/getSearchRecordInfo?searchRecordId=${searchRecordId}`)
        .then((response) => {
            console.log('fetchData() response:', response); 
            setApiData(response.data);
        })
        .catch((error) => {
          console.error('fetchData() error:', error);
          alert(error.response.data);
        });
      };
    
    const handleCopy = (searchRecordId) => {
        try{
            fetchData(searchRecordId);

            if(!apiData) {
                alert('No data to copy');
                return;
            }
            const apiDatastring = JSON.stringify(apiData);
            navigator.clipboard.writeText(apiDatastring)
            .then(() => {
            console.log('apiData',apiDatastring);
            alert('Data copied to clipboard successfully');
            })
            .catch((error) => {
            console.error('Clipboard writeText error:', error);
            alert('try error',error);
            });
        } catch (error) {
            console.error('handleCopy():', error);
            alert('catch error',error);
          }
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
                                    <span></span>
                                    <button className="search-history-copy-button"onClick={() => handleCopy(conceptData.searchRecordIds[0])}>Copy</button>
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