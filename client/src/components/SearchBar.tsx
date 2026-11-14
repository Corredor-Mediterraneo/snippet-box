import { useRef, useEffect, KeyboardEvent, useContext } from 'react';
import { SnippetsContext } from '../store';
import { searchParser } from '../utils';

interface Props {
  onShowAdvanced?: () => void;
  onShowHelp?: () => void;
}

export const SearchBar = (props: Props): JSX.Element => {
  const { searchSnippets } = useContext(SnippetsContext);
  const { onShowAdvanced, onShowHelp } = props;
  const inputRef = useRef<HTMLInputElement>(document.createElement('input'));

  useEffect(() => {
    inputRef.current.focus();
  }, [inputRef]);

  const inputHandler = (e: KeyboardEvent<HTMLInputElement>) => {
    const query = searchParser(inputRef.current.value);

    if (e.key === 'Enter') {
      searchSnippets(query);
    } else if (e.key === 'Escape') {
      inputRef.current.value = '';
      searchSnippets(searchParser(inputRef.current.value));
    }
  };

  return (
    <div className='mb-3'>
      <div className='input-group'>
        <input
          type='text'
          className='form-control'
          placeholder='card lang:typescript tags:ui,react'
          ref={inputRef}
          onKeyUp={e => inputHandler(e)}
        />
        {onShowAdvanced && (
          <button
            type='button'
            className='btn btn-outline-secondary'
            onClick={onShowAdvanced}
            title='Advanced search'
          >
            Advanced
          </button>
        )}
        {onShowHelp && (
          <button
            type='button'
            className='btn btn-outline-secondary'
            onClick={onShowHelp}
            title='Search help'
          >
            ?
          </button>
        )}
      </div>
      <div className='form-text text-gray ms-1'>
        Search by pressing <kbd>Enter</kbd>. Clear with <kbd>Esc</kbd>.
        {onShowHelp && (
          <span>
{' '}
            Read more about available filters{' '}
            <a
              href='#'
              onClick={e => { e.preventDefault(); onShowHelp(); }}
              className='text-success text-decoration-none'
            >
              here
            </a>
          </span>
        )}
      </div>
    </div>
  );
};
