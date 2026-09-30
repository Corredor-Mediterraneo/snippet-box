import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navigation/Navbar';
import { Editor, Home, Snippet, Snippets } from './containers';
import { SnippetsContextProvider } from './store';

export const App = () => {
  return (
    <BrowserRouter>
      <SnippetsContextProvider>
        <Navbar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/snippets' element={<Snippets />} />
          <Route path='/snippet/:id' element={<Snippet />} />
          <Route path='/editor/:id?' element={<Editor />} />
        </Routes>
      </SnippetsContextProvider>
    </BrowserRouter>
  );
};
