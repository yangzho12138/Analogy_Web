import React, {useState, useEffect} from 'react';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import './Search.css';
import { Button, Badge, Form } from 'react-bootstrap';
import SearchHistory from './SearchHistory';
// test123@illinois.edu
// test123
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
    const [searchHistories, setSearchHistories] = useState([]);

    // item
    // {
    //     "name": "Software Engineering",
    //     "status": false,
    //     "userId": null,
    //     "id": "652237e654b65a1d407f4013"
    // }
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
        }else{
            axios.post('/api/search', { "query":query, "tag":selectedTag, "concept":selectedConceptId })
            .then(response => {
                if (response.status === 200) {
                    console.log('Search response => ',response.data);
                    setSearchResults(response.data.map(result => ({ title: result.title, url: result.url, id: result.id, searchHistoryId: result.searchHistoryId, isRelevant: result.isRelevant, tag: result.tag})));
                    const initialRelevanceData = Array(response.data.length).fill(0);
                    setRelevanceData(initialRelevanceData);
                }
            }
            )
            .catch(error => {
                console.error('Search error:', error);
                alert('Search failed.');
            }
            );
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
                console.log('Choose API',conceptList);
            }
        })
        .catch(error => {
            console.error('Concept selection error:', error);
            alert('Concept selection failed.');
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
            }
        })
        .catch(error => {
            console.error('Concept unselection error:', error);
            alert('Concept unselection failed.');
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
    console.log('searchData => ',searchData,"type => ",typeof(searchData));
    axios.post('/api/search/saveSearchHistory', {searchRecords:searchData} , {
        headers: {
        'Content-Type': 'application/json',
        },
    })
        .then((response) => {
        if (response.status === 200) {
            alert('Data saved successfully.');
        } else {
            alert('Data could not be saved.');
        }
        })
        .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred while saving data.');
        });
    };
    
    const getAllSearchHistories = () => {
        axios.get('/api/search/getAllSearchHistory')
        .then(res => {
            if (res.status === 200){
                console.log('getAllSearchHistories() => ',res.data);
                setSearchHistories(res.data);
            }
            else{
                console.log('Invalid credentials');
            }
        }
        )
        .catch(error => {
            console.error('Axios error => ',error);
        })
    }
    
    useEffect(() => {
        if (selectedConceptId && concept) {
            handleChooseConcept();
            console.log(selectedConceptId,'-', concept)
        }
    }, [selectedConceptId, concept]);

    return (
        
        <div className='search-container'>
            <div className='search-history-container'>
                <SearchHistory />
            </div>
            {!concept && (
                <Form>
                <Form.Group>
                    <Form.Label>Select Concept</Form.Label>
                    <Form.Control as="select" value={concept} onClick={getAllConcepts} onChange={e => {
                        setSelectedConceptId(e.target.options[e.target.selectedIndex].value);
                        setConcept(e.target.options[e.target.selectedIndex].text);
                        console.log('selectedConceptId => ',e.target.options[e.target.selectedIndex].value);
                        console.log('concept => ',e.target.options[e.target.selectedIndex].text);
                        // handleChooseConcept(e);
                    }}>
                        <option value={0} >Select concept</option>
                        {conceptList.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
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
                    < SearchIcon />
                </button>
            </div>
            <div className='search-results'>
                {searchResults.map((result, index) => (
                    <div key={result.id} className='search-result'>
                        <div>{result.title}</div>
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
                            Relevant
                            <input
                            type='radio'
                            name={`result${index}`}
                            value={2}
                            checked={relevanceData[index] === 2}
                            onClick={() => handleRelevanceChange(index, relevanceData[index]===2?0:2)}
                            />
                            Non-Relevant
                            <input
                            type='radio'
                            name={`result${index}`}
                            value={3}
                            checked={relevanceData[index] === 3}
                            onClick={() => handleRelevanceChange(index, relevanceData[index]===3?0:3)}
                            />
                            Other
                        </div>
                    </div>
                ))}
            </div>
            {searchResults.length>0 && (
                <button className='search-save-button' onClick={handleSave}>
                    Save
                </button>)}
</>
            )}
        </div>
    );
    
}

export default Search;