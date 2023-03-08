import React from "react";

import Image from "next/image";
import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Tab } from "@headlessui/react";
// services
import issuesServices from "services/issues.service";
import projectService from "services/project.service";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import { LinksList, SingleProgressStats } from "components/core";
// ui
import { Avatar } from "components/ui";
// icons
import User from "public/user.png";
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IIssueLabels, IModule, UserAuth } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS, PROJECT_MEMBERS } from "constants/fetch-keys";
// types
type Props = {
  groupedIssues: any;
  issues: IIssue[];
  module?: IModule;
  setModuleLinkModal?: any;
  handleDeleteLink?: any;
  userAuth?: UserAuth;
};

const stateGroupColours: {
  [key: string]: string;
} = {
  backlog: "#3f76ff",
  unstarted: "#ff9e9e",
  started: "#d687ff",
  cancelled: "#ff5353",
  completed: "#096e8d",
};

export const SidebarProgressStats: React.FC<Props> = ({
  groupedIssues,
  issues,
  module,
  setModuleLinkModal,
  handleDeleteLink,
  userAuth,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { storedValue: tab, setValue: setTab } = useLocalStorage("tab", "Assignees");

  const { data: issueLabels } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(workspaceSlug as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const currentValue = (tab: string | null) => {
    switch (tab) {
      case "Links":
        return 0;
      case "Assignees":
        return 1;
      case "Labels":
        return 2;
      case "States":
        return 3;

      default:
        return 3;
    }
  };
  return (
    <Tab.Group
      defaultIndex={currentValue(tab)}
      onChange={(i) => {
        switch (i) {
          case 0:
            return setTab("Links");
          case 1:
            return setTab("Assignees");
          case 2:
            return setTab("Labels");
          case 3:
            return setTab("States");

          default:
            return setTab("States");
        }
      }}
    >
      <Tab.List
        as="div"
        className={`flex w-full items-center justify-between rounded-md bg-gray-100 px-1 py-1.5 
        ${module ? "text-xs" : "text-sm"} `}
      >
        {module ? (
          <Tab
            className={({ selected }) =>
              `w-full rounded px-3 py-1 text-gray-900  ${
                selected ? " bg-theme text-white" : "  hover:bg-hover-gray"
              }`
            }
          >
            Links
          </Tab>
        ) : (
          ""
        )}

        <Tab
          className={({ selected }) =>
            `w-full rounded px-3 py-1 text-gray-900  ${
              selected ? " bg-theme text-white" : "  hover:bg-hover-gray"
            }`
          }
        >
          Assignees
        </Tab>
        <Tab
          className={({ selected }) =>
            `w-full rounded px-3 py-1  text-gray-900 ${
              selected ? " bg-theme text-white" : " hover:bg-hover-gray"
            }`
          }
        >
          Labels
        </Tab>
        <Tab
          className={({ selected }) =>
            `w-full rounded px-3 py-1  text-gray-900 ${
              selected ? " bg-theme text-white" : " hover:bg-hover-gray"
            }`
          }
        >
          States
        </Tab>
      </Tab.List>
      <Tab.Panels className="flex w-full items-center justify-between p-1">
        {module ? (
          <Tab.Panel as="div" className="flex w-full flex-col text-xs ">
            <button
              type="button"
              className="flex w-full items-center justify-start gap-2 rounded px-4 py-2  hover:bg-theme/5"
              onClick={() => setModuleLinkModal(true)}
            >
              <PlusIcon className="h-4 w-4" /> <span>Add Link</span>
            </button>
            <div className="mt-2 space-y-2 hover:bg-theme/5">
              {userAuth && module.link_module && module.link_module.length > 0 ? (
                <LinksList
                  links={module.link_module}
                  handleDeleteLink={handleDeleteLink}
                  userAuth={userAuth}
                />
              ) : null}
            </div>
          </Tab.Panel>
        ) : (
          ""
        )}

        <Tab.Panel as="div" className="flex w-full flex-col text-xs ">
          {members?.map((member, index) => {
            const totalArray = issues?.filter((i) => i.assignees?.includes(member.member.id));
            const completeArray = totalArray?.filter((i) => i.state_detail.group === "completed");
            if (totalArray.length > 0) {
              return (
                <SingleProgressStats
                  key={index}
                  title={
                    <>
                      <Avatar user={member.member} />
                      <span>{member.member.first_name}</span>
                    </>
                  }
                  completed={completeArray.length}
                  total={totalArray.length}
                />
              );
            }
          })}
          {issues?.filter((i) => i.assignees?.length === 0).length > 0 ? (
            <SingleProgressStats
              title={
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-white bg-white">
                    <Image
                      src={User}
                      height="100%"
                      width="100%"
                      className="rounded-full"
                      alt="User"
                    />
                  </div>
                  <span>No assignee</span>
                </>
              }
              completed={
                issues?.filter(
                  (i) => i.state_detail.group === "completed" && i.assignees?.length === 0
                ).length
              }
              total={issues?.filter((i) => i.assignees?.length === 0).length}
            />
          ) : (
            ""
          )}
        </Tab.Panel>
        <Tab.Panel as="div" className="flex w-full flex-col ">
          {issueLabels?.map((issue, index) => {
            const totalArray = issues?.filter((i) => i.labels?.includes(issue.id));
            const completeArray = totalArray?.filter((i) => i.state_detail.group === "completed");
            if (totalArray.length > 0) {
              return (
                <SingleProgressStats
                  key={index}
                  title={
                    <div className="flex items-center gap-2">
                      <span
                        className="block h-3 w-3 rounded-full "
                        style={{
                          backgroundColor: issue.color,
                        }}
                      />
                      <span className="text-xs capitalize">{issue.name}</span>
                    </div>
                  }
                  completed={completeArray.length}
                  total={totalArray.length}
                />
              );
            }
          })}
        </Tab.Panel>
        <Tab.Panel as="div" className="flex w-full flex-col ">
          {Object.keys(groupedIssues).map((group, index) => (
            <SingleProgressStats
              key={index}
              title={
                <div className="flex items-center gap-2">
                  <span
                    className="block h-3 w-3 rounded-full "
                    style={{
                      backgroundColor: stateGroupColours[group],
                    }}
                  />
                  <span className="text-xs capitalize">{group}</span>
                </div>
              }
              completed={groupedIssues[group].length}
              total={issues.length}
            />
          ))}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};