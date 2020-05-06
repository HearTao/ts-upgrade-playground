import React, { useEffect, useState, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import { style } from 'typestyle'
import { TextField, PrimaryButton, Stack, ProgressIndicator, MessageBar, MessageBarType } from '@fluentui/react'
import { useConstCallback } from '@uifabric/react-hooks';
import * as uuid from 'uuid'
import { Status, createUpgradeTask, pollUpgradeTask } from './api';

function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function App() {
  const [url, setUrl] = useState('')
  const [repo, setRepo] = useState('')
  const [owner, setOwner] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [id, setId] = useState('')
  const [status, setStatus] = useState(Status.none)
  const [lastStatus, setLastStatus] = useState(Status.none)
  const [statusText, setStatusText] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [inputed, setInputed] = useState(false)

  useEffect(() => {
    try {
      const parsedUrl = new URL(url)
      const pathname = parsedUrl.pathname
      const [parsedOwner, parsedRepo] = pathname.split('/').map(x => x.trim()).filter(Boolean)

      if (!parsedRepo || !parsedOwner) {
        throw new Error("invalid path")
      }

      setOwner(parsedOwner)
      setRepo(parsedRepo)
    } catch (e) {
      if (inputed) {
        setErrorMessage("Invalid repo url.")
      }
    }
  }, [url, inputed])

  useInterval(() => {
    const lv = status
    if (id && status !== Status.done && status !== Status.error) {
      pollUpgradeTask({ id }).then(resp => {
        if (resp.data.data) {
          if (status >= lv) {
            setStatus(resp.data.data.status._)
            setLastStatus(resp.data.data.lastStatus._)
          }
        }
      })
    }
  }, 3000)

  useEffect(() => {
    setStatusText(Status[status])
  }, [status, statusText])

  const onInputChanged = useConstCallback(
    (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
      setErrorMessage('')
      setUrl(newValue || '');
      setInputed(true)
    }
  )

  const onButtonClick = () => {
    const uid = uuid.v4()
    setId(uid)
    createUpgradeTask({
      options: {
        id: uid,
        owner,
        repo
      }
    }).then(resp => {
      setId('')
      setSuccessMessage(resp.data.pr)
    })
  }

  const buttonDisabled = !!id || !owner || !repo
  const progressText = `current is ${statusText}`

  return (
    <Stack tokens={{ childrenGap: 12, padding: 12 }}>
      <TextField
        value={url}
        onChange={onInputChanged}
        label="Github Repo"
        placeholder="eg: https://github.com/HearTao/ts-upgrade" />
      <PrimaryButton disabled={buttonDisabled} text="Go!" onClick={onButtonClick} />
      {
        id ? (
          <ProgressIndicator description={progressText} />
        ) : null
      }
      {
        errorMessage ? (
          <MessageBar
            messageBarType={MessageBarType.error}
            isMultiline={false}
          >{errorMessage}</MessageBar>
        ) : null
      }
      {
        successMessage ? (
          <MessageBar messageBarType={MessageBarType.success} isMultiline={false}>{successMessage}</MessageBar>
        ) : null
      }
    </Stack>
  );
}

export default App;
