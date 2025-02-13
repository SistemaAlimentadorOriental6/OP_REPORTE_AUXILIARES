import React, { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'

const TabsContext = createContext()

export const Tabs = ({ children, defaultValue, onValueChange }) => {
  const [value, setValue] = useState(defaultValue)

  return (
    <TabsContext.Provider value={{ value, setValue, onValueChange }}>
      <div className="w-full">{children}</div>
    </TabsContext.Provider>
  )
}

Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  defaultValue: PropTypes.string.isRequired,
  onValueChange: PropTypes.func,
}

export const TabsList = ({ children }) => {
  return (
    <div className="flex space-x-1 rounded-xl bg-emerald-100 p-1 mb-4">
      {children}
    </div>
  )
}

TabsList.propTypes = {
  children: PropTypes.node.isRequired,
}

export const TabsTrigger = ({ value, children }) => {
  const { value: selectedValue, setValue, onValueChange } = useContext(TabsContext)
  const isActive = value === selectedValue

  const handleClick = () => {
    setValue(value)
    if (onValueChange) {
      onValueChange(value)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-emerald-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-emerald-400 focus:outline-none focus:ring-2 transition-all duration-300 ease-in-out ${
        isActive
          ? 'bg-white shadow'
          : 'text-emerald-500 hover:bg-white/[0.12] hover:text-emerald-600'
      }`}
    >
      {children}
    </button>
  )
}

TabsTrigger.propTypes = {
  value: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

export const TabsContent = ({ value, children }) => {
  const { value: selectedValue } = useContext(TabsContext)

  if (value !== selectedValue) return null

  return <div className="mt-4">{children}</div>
}

TabsContent.propTypes = {
  value: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}