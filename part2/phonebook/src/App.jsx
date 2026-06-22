import { useState, useEffect } from 'react'
import personService from './services/persons'

const Notification = ({notification}) => {
  if(notification.text === null) return null
  const notifStyle = {
    color: notification.type === 'error' ? 'red' : 'green',
    background: 'lightgrey',
    fontSize: 20,
    borderStyle: 'solid',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  }

  return (
    <div style={notifStyle}>
      {notification.text}
    </div>
  )
}

const Filter = ({ filter, onChange }) => {
  return (
    <div>
      filter shown with <input value={filter} onChange={onChange} />
    </div>
  )
}

const PersonForm = ({onSubmit,newName,onChangeName,newNumber,onChangeNumber}) => {
  return (
    <form onSubmit={onSubmit}>
      <div>
        name: <input value={newName} onChange={onChangeName} required />
      </div>
      <div>
        number: <input value={newNumber} onChange={onChangeNumber} required />
      </div>
      <div>
        <button type="submit">add</button>
      </div>
    </form>
  )
}

const Person = ({ person, deletePerson }) => {
  return (
    <div>
      {person.name} {person.number} <button onClick={deletePerson}>delete</button>
    </div>
  )
}

const Persons = ({ filteredPersons, handleDelete }) => {
  return (
    <div>
      {filteredPersons.map(person => (
        <Person key={person.name} person={person} deletePerson={()=>handleDelete(person)} />
      ))}
    </div>
  )
}

const App = () => {
  const [persons, setPersons] = useState([])
  const [newName, setNewName] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [filter, setFilter] = useState('')
  const [notification, setNotification] = useState({text: null, type: 'success'})

  useEffect(() => {
    personService
      .getAll()
      .then(initialPersons => {
        setPersons(initialPersons)
      })
      .catch(error => {
        console.error('Failed to fetch initial phonebook data:', error)
        alert('Could not connect to the server. Please try again later.')
      })
  }, [])

  const handleFilterChange = event => {
    setFilter(event.target.value)
  }

  const addPerson = event => {
    event.preventDefault()

    const newPerson = {
      name: newName.trim(),
      number: newNumber.trim()
    }

    // if (persons.map(person => person.name).includes(newName)) {
    const matching = persons.find(person => person.name.trim().toLowerCase() === newName.trim().toLowerCase())
    if (matching !== undefined) {
      if(window.confirm(`${matching.name} is already added to phonebook, replace the old number with a new one?`)){
        personService
          .update(matching.id,newPerson)
          .then(returnedPerson => {
            setPersons(persons.map(person => person.id === returnedPerson.id ? returnedPerson : person))
            setNewName('')
            setNewNumber('')
            setNotification({text:`Updated ${returnedPerson.name}`,type:'success'})
            setTimeout(()=>{setNotification({text: null, type: 'success'})},5000)
          })
          .catch(error => {
            console.error("Failed to update person:", error)
            setPersons(persons.filter(p => p.id !== matching.id))
            setNotification({ 
              text: `Information of ${matching.name} has already been removed from server`, 
              type: 'error' 
            })
            setTimeout(() => setNotification({text: null, type: 'success'}), 5000)
          })
      }
    }
    else {
      personService
        .create(newPerson)
        .then(returnedPerson => {
          setPersons(persons.concat(returnedPerson))
          setNewName('')
          setNewNumber('')
          setNotification({text:`Added ${returnedPerson.name}`,type:'success'})
          setTimeout(()=>{setNotification({text: null, type: 'success'})},5000)
        })
        .catch(error => {
          console.error("Failed to add person:", error)
          setNotification({text:`Failed to add ${newName.trim()} to the server.`,type:'error'})
          setTimeout(() => setNotification({text: null, type: 'success'}), 5000)
        })
    }
  }

  const handleNameChange = event => {
    setNewName(event.target.value)
  }

  const handleNumberChange = event => {
    setNewNumber(event.target.value)
  }

  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(filter.trim().toLowerCase())
  )

  const handleDelete = person => {
    if(window.confirm(`Delete ${person.name} ?`) === true){
      personService
        .remove(person.id)
        .then(() => {
          setPersons(persons.filter(p => p.id !== person.id))
          setNotification({text:`Deleted ${person.name}`, type:'success'})
          setTimeout(() => setNotification({text: null, type: 'success'}), 5000)
        })
        .catch(error => {
          console.error("Failed to delete person:", error)
          setNotification({text:`Failed to delete ${person.name}. They might have already been removed from the server.`,type:'error'})
          setTimeout(() => setNotification({text: null, type: 'success'}), 5000)
        })
    }
  }

  return (
    <div>
      <h2>Phonebook</h2>
      <Notification notification={notification} />
      <Filter filter={filter} onChange={handleFilterChange} />
      <h3>Add a new</h3>
      <PersonForm
        onSubmit={addPerson}
        newName={newName}
        newNumber={newNumber}
        onChangeName={handleNameChange}
        onChangeNumber={handleNumberChange}
      />
      <h3>Numbers</h3>
      <Persons filteredPersons={filteredPersons} handleDelete={handleDelete} />
    </div>
  )
}

export default App
