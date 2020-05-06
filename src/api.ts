import axios from 'axios'
import { TypeScriptVersion } from 'ts-upgrade'

export enum Status {
    none = -2,
    error = -1,
    auth = 0,
    fork,
    clone,
    branch,
    checkout,
    upgrade,
    add,
    commit,
    push,
    star,
    pr,
    done
}

export interface CreateTaskOptions {
    owner: string
    repo: string
    branch?: string
    id: string
    version?: TypeScriptVersion
}

export interface OptionsRequest<T> {
    options: T
}

export interface CreateTaskResponse {
    pr: string
}

export function createUpgradeTask (options: OptionsRequest<CreateTaskOptions>) {
    return axios.post<CreateTaskResponse>("https://ts-upgrade.azurewebsites.net/api/doUpgrade", options)
}

export interface PollTaskOptions {
    id: string
}

interface TableResult<T> {
    _: T
}

export interface PollTaskResult {
    branch: string
    status: Status 
    lastStatus: Status
    owner: string
    repo: string
    version: TypeScriptVersion
}

type PollTaskResponse = {
    data?: { [key in keyof PollTaskResult]: TableResult<PollTaskResult[key]> }
}

export function pollUpgradeTask(options: PollTaskOptions) {
    return axios.post<PollTaskResponse>("https://ts-upgrade.azurewebsites.net/api/upgradeStatus", options)
}
