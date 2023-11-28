import React, { useState } from 'react';
import { Flex, Input, InputGroup, InputLeftElement, Icon } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Navigate to the user page with the searchQuery
    navigate(`/${searchQuery}`);
  };

  return (
    <Flex
      direction="column"
      align="center"
      position="relative"
      zIndex="1"
      boxShadow="md"
      borderRadius="lg"
      p="4"
    >
      {/* Your header components go here */}
      {/* For example: <Header /> */}

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit}>
        <InputGroup width="100%" maxWidth="600px">
          <InputLeftElement
            pointerEvents="none"
            children={<Icon as={SearchIcon} color="gray.500" />}
          />
          <Input
            type="text"
            placeholder="Search..."
            border="2px solid"
            borderColor="gray.300"
            borderRadius="md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </form>
    </Flex>
  );
};

export default SearchPage;
