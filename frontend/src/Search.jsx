import React, {useState, useEffect} from 'react';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import './Search.css';
import { Button, Badge, Form } from 'react-bootstrap';
import SearchHistory from './SearchHistory';
import LoadingOverlay from './LoadingOverlay';

function Search() {
    const [query, setQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('Select tag');
    const [searchResults, setSearchResults] = useState([]);
    const [relevanceData, setRelevanceData] = useState([]);
    const [conceptList, setConceptList] = useState([]);
    const [originalConceptList, setoriginalConceptList] = useState([]);
    const [concept, setConcept] = useState('');
    const tagOptions = ['Select tag','Self-generated', 'Chat-GPT query', 'Chat-GPT analogy','Other'];
    const [selectedConceptId, setSelectedConceptId] = useState('');
    const [linkInput, setLinkInput] = useState('');
    const [searchHistoryUpdated, setSearchHistoryUpdated] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [apiData, setApiData] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const getAllConcepts = () => {
        axios.get('/api/concept/getAll')
        .then(res => {
            if (res.status === 200){
                console.log('getAllConcepts() => ',res.data);
                setoriginalConceptList(res.data);
                setConceptList(res.data);
            }
            else{
                console.log('Invalid credentials');
            }
        }
        )
        .catch(error => {
            console.error('Axios error => ',error);
        }
        )};

    const handleSearch = () => {
        if (query.trim() === '' || selectedTag === 'Select tag') {
            alert('Please enter both a search query and select a tag.');
        }   
        else{
            if (
                (selectedTag === 'Chat-GPT query' ||
                selectedTag === 'Chat-GPT analogy' ||
                selectedTag === 'Other') &&
                linkInput.trim() === ''
            ) {
                alert('Please paste the Chat-GPT link in the Chat-GPT link box.');
            }
            else{
            setSearchLoading(true);
            axios.post('/api/search', { "query":query, "tag":selectedTag, "concept":selectedConceptId, "link": linkInput })
            .then(response => {
                if (response.status === 200) {
                    console.log('Search response => ',response.data);
                    setSearchResults(response.data.map(result => ({ url: result.url, id: result.id, searchHistoryId: result.searchHistoryId, isRelevant: result.isRelevant, tag: result.tag})));
                    console.log('handleSearch searchResults => ',searchResults);
                    const initialRelevanceData = Array(response.data.length).fill(0);
                    setRelevanceData(initialRelevanceData);
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                alert(error.response.data);
            })
            .finally(() => {
                setSearchLoading(false);
            });
            }
        }
    };

    const handleChooseConcept =  () => {
        axios.post('/api/concept/select', {
            concept: selectedConceptId,
        })
        .then(response => {
            if (response.status === 201) {
                const chosenConcept = conceptList.find(concept => concept.id === selectedConceptId);
                setConceptList(conceptList.filter(item => item.id !== selectedConceptId));
                setConcept(chosenConcept.name);
                console.log('handleChooseConcept => ',isSubmitted);
                setIsSubmitted(true);
                setSearchResults([]);
                console.log('Choose API',conceptList);
                alert('Concept selected successfully.');
            }
        })
        .catch(error => {
            console.error('Concept selection error:', error);
            alert(error.response.data);
        });
    };

    const handleUnselectConcept = () => {
        console.log('unselect concept => ',conceptList);
        console.log('unselect selectedConceptId => ',selectedConceptId);
        axios.post('/api/concept/unselect', {
            concept: selectedConceptId,
        })
        .then(response => {
            if (response.status === 201) {
                const unselectedConcept = originalConceptList.find(concept => concept.id === selectedConceptId);
                setConceptList([...conceptList, unselectedConcept]);
                setConcept('');
                console.log('handleUnselectConcept => ',isSubmitted);
                setIsSubmitted(false);
        }})
        .catch(error => {
            console.error('Concept unselection error:', error);
            alert(error.response.data);
        });
    };
    const handleRelevanceChange = (index, isRelevant) => {
        const updatedRelevanceData = [...relevanceData];
        updatedRelevanceData[index] = isRelevant;
        setRelevanceData(updatedRelevanceData);
      };
    
    const handleSave = () => {
        const searchData = searchResults.map((result, index) => ({
            title: result.title,
            url: result.url,
            id: result.id,
            searchHistoryId: result.searchHistoryId,
            tag: result.tag,
            isRelevant: relevanceData[index]
        }));
        setSaveLoading(true);
        console.log('searchData => ',searchData,"type => ",typeof(searchData));
        axios.post('/api/search/saveSearchHistory', {searchRecords:searchData} , {
            headers: {
            'Content-Type': 'application/json',
            },
        })
            .then((response) => {
            if (response.status === 200) {
                alert('Data saved successfully.');
                setSearchHistoryUpdated(!searchHistoryUpdated);
            } else {
                alert('Data could not be saved.');
            }
            })
            .catch((error) => {
            console.error('Error:', error);
            alert(error.response.data);
            })
            .finally(() => {
                setSaveLoading(false); 
            });
    };

    const handleSearchRecordSelection = (selectedRecordId) => {
        console.log('selectedRecord => ',selectedRecordId);
      
        axios.get('/api/search/getSearchHistoryDetail?id='+selectedRecordId)
        .then(response => {
            if (response.status === 200) {
            console.log('search history detail',response.data);
            setSearchResults(response.data.searchRecords.map(result => ({ url: result.url, id: result.id, searchHistoryId: result.searchHistoryId, isRelevant: result.isRelevant, tag: result.tag})));
            console.log('searchResults => ',searchResults);
            const selectedRelevanceData = response.data.searchRecords.map(result => result.isRelevant);
            setRelevanceData(selectedRelevanceData);
            }

        })
        .catch(error => {
            console.error('SearchHistoryDetail error:', error);
            alert(error.response.data);
        })
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
    
    useEffect(() => {
        getAllConcepts();
    },[]);

    useEffect(() => {
        axios.get('/api/concept/getSelected')
            .then(response => {
                if (response.status === 200 && Object.keys(response.data).length > 0) {
                    if (selectedConceptId !== response.data.id) {
                        console.log('Selected concept => ',response.data.id, 'selected concept id',selectedConceptId);
                    setConcept(response.data.name);
                    setSelectedConceptId(response.data.id);
                    setIsSubmitted(true);
                }
                } else if(response.status === 200 && Object.keys(response.data).length === 0){
                    setConcept('');
                }
            })
            .catch(error => {
                console.error('Axios error => ', error);
            });
    }, []);


    return (
        
        <div className='search-container'>
            <LoadingOverlay loading={searchLoading} />
            <div className='search-history-container'>
                <SearchHistory 
                onSearchRecordSelect={handleSearchRecordSelection}
                searchHistoryUpdated={searchHistoryUpdated} />
            </div>
            {!concept && (
                <Form>
                <Form.Group>
                    <Form.Label>Select Concept</Form.Label>
                    <Form.Control as="select" value={concept} onClick={getAllConcepts} onChange={e => {
                        setSelectedConceptId(e.target.options[e.target.selectedIndex].value);
                        setConcept(e.target.options[e.target.selectedIndex].text);
                    }}>
                         {conceptList.length === 0 ? (
                            <option value={0}>No concepts available</option>
                        ) : (
                            <option value={0} >Select concept</option>
                        )}
                        {console.log('conceptList => ',conceptList)}
                        {conceptList && conceptList.length>0 && conceptList.map(item => (
                            item===undefined ? null:(
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>)
                        ))}
                    </Form.Control>
                </Form.Group>
            </Form>
            )}
    
            {concept && selectedConceptId !== null && (
                <>
                    <Badge pill variant="primary">
                        {concept}
                        <Button
                            variant="light"
                            size="sm"
                            onClick={handleUnselectConcept}
                        >
                            x
                        </Button>
                    </Badge>
                </>
            )}
            
            {concept && (
                    <Button className='search-concept-submit-button' variant="primary" onClick={handleChooseConcept} disabled={isSubmitted===true}>
                    Submit
                    </Button>
            )}

            {concept && (
                <>
                <div className='search-bar'>
                <input className='search-input' type='text' placeholder='Search' value={query} onChange={e => setQuery(e.target.value)}/>
                <select className='search-tag' value={selectedTag} onChange={e => setSelectedTag(e.target.value)}>
                    {tagOptions.map(tag => (
                        <option key={tag} value={tag}>
                            {tag}
                        </option>
                    ))}
                </select>
                <button className='search-button' onClick={handleSearch}>
                    <SearchIcon />
                </button>
                {selectedTag === 'Chat-GPT query' ||
                            selectedTag === 'Chat-GPT analogy' ||
                            selectedTag === 'Other' ? (
                            <input
                                className="search-input"
                                type="text"
                                placeholder="Chat-GPT link"
                                value={linkInput}
                                onChange={e => setLinkInput(e.target.value)}
                            />
                        ) : null}
            </div>
            
</>
            )}

            <div className='search-results'>
                {searchResults.map((result, index) => (
                    <div key={result.id} className='search-result'>
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                            {result.url}
                        </a>
                          <div className='radio-buttons'>
                            <input
                            type='radio'
                            name={`result${index}`}
                            value={1}
                            checked={relevanceData[index] === 1}
                            onClick={() => handleRelevanceChange(index, relevanceData[index]===1?0:1)}
                            />
                            Contains relevant analogy
                            <input
                            type='radio'
                            name={`result${index}`}
                            value={2}
                            checked={relevanceData[index] === 2}
                            onClick={() => handleRelevanceChange(index, relevanceData[index]===2?0:2)}
                            />
                            No analogy
                            <input
                            type='radio'
                            name={`result${index}`}
                            value={3}
                            checked={relevanceData[index] === 3}
                            onClick={() => handleRelevanceChange(index, relevanceData[index]===3?0:3)}
                            />
                            Contains analogy about other concepts
                            <button className="search-copy-button"onClick={() => handleCopy(result.id)} disabled={relevanceData[index]===0}>Copy</button>  
                        </div>
                    </div>
                ))}
            </div>
            <LoadingOverlay loading={saveLoading} />
            {searchResults.length>0 && (
                <button className='search-save-button' onClick={handleSave}>
                    Save
                </button>)}
        </div>
    );
    
}

export default Search;