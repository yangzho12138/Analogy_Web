import React, {useState} from 'react';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import './Search.css';

function Search() {
    const [query, setQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('Select tag');
    const [searchResults, setSearchResults] = useState([]);
    const [relevanceData, setRelevanceData] = useState([]);
    const [textData, setTextData] = useState([]);
    const tagOptions = ['Select tag','Tag1', 'Tag2', 'Tag3','Tag4'];
    const handleSearch = () => {
        if (query.trim() === '' || selectedTag === 'Select tag') {
            // Display an alert if either the query or tag is missing
            alert('Please enter both a search query and select a tag.');
        }else{
        const dummySearchResults = [
            { id: 1, title: 'Result 1' },
            { id: 2, title: 'Result 2' },
            { id: 3, title: 'Result 3' },
            { id: 4, title: 'Result 4' },
            { id: 5, title: 'Result 5' },
            { id: 6, title: 'Result 6' },
            { id: 7, title: 'Result 7' },
            { id: 8, title: 'Result 8' },
            { id: 9, title: 'Result 9' },
            { id: 10, title: 'Result 10' },
            // Add more results here
          ];
        
        setSearchResults(dummySearchResults);
        
        const initialRelevanceData = Array(dummySearchResults.length).fill(false);
        const initialTextData = Array(dummySearchResults.length).fill('');

        setRelevanceData(initialRelevanceData);
        setTextData(initialTextData);
        }

    };

    const handleRelevanceChange = (index, isChecked) => {
        const updatedRelevanceData = [...relevanceData];
        updatedRelevanceData[index] = isChecked;
        setRelevanceData(updatedRelevanceData);
      };
    
      const handleTextChange = (index, text) => {
        const updatedTextData = [...textData];
        updatedTextData[index] = text;
        setTextData(updatedTextData);
      };
      

    const handleSave = () => {
    // Combine relevanceData and textData into an array of objects
    const searchData = searchResults.map((result, index) => ({
        title: result.title,
        isRelevant: relevanceData[index],
        text: textData[index],
    }));

    // Make an API call to send searchData to the backend using Axios
    axios.post('your-backend-api-endpoint', searchData, {
        headers: {
        'Content-Type': 'application/json',
        },
    })
        .then((response) => {
        // Handle the response as needed
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

    return (
        <div className='search-container'>
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
                    {/* <i className="fa fa-search"></i> */}
                    < SearchIcon />
                </button>
            </div>
            <div className='search-results'>
                {searchResults.map((result, index) => (
                    <div key={result.id} className='search-result'>
                        {result.title}
                        <input
                        type='checkbox'
                        checked={relevanceData[index]}
                        onChange={(e) => handleRelevanceChange(index, e.target.checked)}
                        />
                        <input
                        type='text'
                        placeholder='Enter text'
                        value={textData[index]}
                        onChange={(e) => handleTextChange(index, e.target.value)}
                        />
                    </div>
                ))}
            </div>
            {searchResults.length>0 && (
                <button className='search-save-button' onClick={handleSave}>
                    Save
                </button>)}
        </div>
    );
}

export default Search;


// const searchquery = {
//     query,
//     selectedTag
//   };
    // Make an API call to the backend to register the user
//   axios.post('http://localhost:5000/api/signup', searchquery)
//     .then(response => {
//       if (response.status === 200) {
//         setSearchResults(dummySearchResults);
//       }
//     })
//     .catch(error => {
//       console.error('Search error:', error);
//       alert('Search failed.');
//     });