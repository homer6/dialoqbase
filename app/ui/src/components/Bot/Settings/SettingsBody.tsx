import {
  Form,
  Input,
  InputNumber,
  notification,
  Select,
  Slider,
  Switch,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import React from "react";
import {
  HELPFUL_ASSISTANT_WITH_CONTEXT_PROMPT,
  HELPFUL_ASSISTANT_WITHOUT_CONTEXT_PROMPT,
} from "../../../utils/prompts";
import { BotSettings } from "../../../@types/bot";
import { SettingsPwdP } from "./SettingPwdP";

export const SettingsBody: React.FC<BotSettings> = ({
  data,
  chatModel,
  embeddingModel,
}) => {
  const [form] = Form.useForm();
  const [disableStreaming, setDisableStreaming] = React.useState(false);
  const params = useParams<{ id: string }>();

  const client = useQueryClient();

  const onFinish = async (values: any) => {
    const response = await api.put(`/bot/${params.id}`, values);
    return response.data;
  };

  const { mutate: updateBotSettings, isLoading } = useMutation(onFinish, {
    onSuccess: () => {
      client.invalidateQueries(["getBotSettings", params.id]);

      notification.success({
        message: "Bot updated successfully",
      });
    },
    onError: (error: any) => {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Something went wrong";
        notification.error({
          message,
        });
        return;
      }
      notification.error({
        message: "Something went wrong",
      });
    },
  });

  const navigate = useNavigate();

  const onDelete = async () => {
    const response = await api.delete(`/bot/${params.id}`);
    return response.data;
  };

  const onCopy = async () => {
    const response = await api.post(`/bot/${params.id}/copy`);
    return response.data;
  };
  const { mutate: deleteBot, isLoading: isDeleting } = useMutation(onDelete, {
    onSuccess: () => {
      client.invalidateQueries(["getAllBots"]);

      navigate("/");

      notification.success({
        message: "Bot deleted successfully",
      });
    },
    onError: (error: any) => {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Something went wrong";
        notification.error({
          message,
        });
        return;
      }

      notification.error({
        message: "Something went wrong",
      });
    },
  });

  const { mutate: copyBot, isLoading: isCopying } = useMutation(onCopy, {
    onSuccess: (data) => {
      client.invalidateQueries(["getAllBots"]);
      navigate(`/bot/${data.id}`);
      notification.success({
        message: "Bot copied successfully",
      });
    },
    onError: (error: any) => {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Something went wrong";
        notification.error({
          message,
        });
        return;
      }

      notification.error({
        message: "Something went wrong",
      });
    },
  });

  const currentModel = Form.useWatch("model", form);

  const isStreamingSupported = (model: string) => {
    return chatModel.find((m) => m.value === model)?.stream === true;
  };

  React.useEffect(() => {
    if (!isStreamingSupported(currentModel) && currentModel) {
      form.setFieldsValue({
        streaming: false,
      });
      setDisableStreaming(true);
    } else {
      setDisableStreaming(false);
      form.setFieldsValue({
        streaming: true,
      });
    }
  }, [currentModel]);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            Configure your bot settings.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <Form
          initialValues={{
            name: data.name,
            model: data.model,
            temperature: data.temperature,
            embedding: data.embedding,
            qaPrompt: data.qaPrompt,
            questionGeneratorPrompt: data.questionGeneratorPrompt,
            streaming: data.streaming,
            showRef: data.showRef,
            use_hybrid_search: data.use_hybrid_search,
            bot_protect: data.bot_protect,
            use_rag: data.use_rag,
            bot_model_api_key: data.bot_model_api_key,
            noOfDocumentsToRetrieve: data.noOfDocumentsToRetrieve,
            noOfChatHistoryInContext: data.noOfChatHistoryInContext,
            semanticSearchSimilarityScore: data.semanticSearchSimilarityScore,
            autoResetSession: data.autoResetSession,
            inactivityTimeout: data.inactivityTimeout,
            autoSyncDataSources: data.autoSyncDataSources,
          }}
          form={form}
          requiredMark={false}
          onFinish={updateBotSettings}
          layout="vertical"
          className="space-y-6 mb-6 "
        >
          <div className="px-4 py-5 bg-white  border sm:rounded-lg sm:p-6 dark:bg-[#1e1e1e] dark:border-gray-700">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  General Settings
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Bot general settings and information.
                </p>
              </div>
              <div className="mt-5 space-y-6 md:col-span-2 md:mt-0">
                <Form.Item
                  name="name"
                  label="Project Name"
                  rules={[
                    {
                      required: true,
                      message: "Please input your Project Name!",
                    },
                  ]}
                >
                  <Input size="large" />
                </Form.Item>

                <Form.Item
                  name="model"
                  label="Model"
                  rules={[
                    {
                      required: true,
                      message: "Please select a model!",
                    },
                  ]}
                >
                  <Select
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label
                        ? option?.label?.toLowerCase()
                        : ""
                      ).includes(input?.toLowerCase())
                    }
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? "")
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? "").toLowerCase())
                    }
                    options={chatModel}
                  />
                </Form.Item>

                <Form.Item
                  hasFeedback={!isStreamingSupported(currentModel)}
                  help={
                    !isStreamingSupported(currentModel) &&
                    "Streaming is not supported for this model."
                  }
                  name="streaming"
                  label="Streaming"
                  valuePropName="checked"
                >
                  <Switch disabled={disableStreaming} />
                </Form.Item>

                <Form.Item
                  name="showRef"
                  label="Cite sources in the chat"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="temperature"
                  label="Temperature"
                  rules={[
                    {
                      required: true,
                      message: "Please select a temperature!",
                    },
                  ]}
                >
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </Form.Item>

                <Form.Item
                  label={"Embedding Method"}
                  name="embedding"
                  help={
                    <>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        If you change the embedding method, make sure to
                        re-fetch the data source or choose a model with the same
                        dimensions
                      </p>
                    </>
                  }
                >
                  <Select
                    placeholder="Select an embedding method"
                    options={embeddingModel}
                  />
                </Form.Item>

                <Form.Item
                  name="noOfDocumentsToRetrieve"
                  label="Number of documents to retrieve"
                  rules={[
                    {
                      required: true,
                      message:
                        "Please input a number of documents to retrieve!",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Enter number of documents to retrieve"
                  />
                </Form.Item>
                <Form.Item
                  name="noOfChatHistoryInContext"
                  label="Number of chat histories in context"
                  rules={[
                    {
                      required: true,
                      message:
                        "Please input a number of chat history in context!",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Enter number of chat history in context"
                  />
                </Form.Item>
                <Form.Item
                  label={"Semantic Search Similarity Score"}
                  name="semanticSearchSimilarityScore"
                  rules={[
                    {
                      required: true,
                      message: "Please input a similarity score!",
                    },
                  ]}
                >
                  <Select
                    placeholder="Select a similarity score"
                    options={[
                      { label: "Consider all documents", value: "none" },
                      {
                        label: "Similarity Score >= 0.2",
                        value: "0.2",
                      },
                      {
                        label: "Similarity Score >= 0.5",
                        value: "0.5",
                      },
                      {
                        label: "Similarity Score >= 0.7",
                        value: "0.7",
                      },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  label={"Question Answering Prompt (System Prompt)"}
                  name="qaPrompt"
                  rules={[
                    {
                      required: true,
                      message: "Please input a prompt!",
                    },
                  ]}
                >
                  <Input.TextArea size="large" rows={5} placeholder="" />
                </Form.Item>

                <div className="flex flex-row justify-start gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      form.setFieldsValue({
                        qaPrompt: HELPFUL_ASSISTANT_WITH_CONTEXT_PROMPT,
                      });
                    }}
                    className="flex items-center rounded-md py-[0.4375rem] pl-2 pr-2 lg:pr-3 bg-white border text-xs dark:bg-[#0a0a0a] dark:border-gray-700"
                  >
                    PROMPT WITH CONTEXT
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      form.setFieldsValue({
                        qaPrompt: HELPFUL_ASSISTANT_WITHOUT_CONTEXT_PROMPT,
                      });
                    }}
                    className="flex items-center rounded-md py-[0.4375rem] pl-2 pr-2 lg:pr-3 bg-white border text-xs dark:bg-[#0a0a0a] dark:border-gray-700"
                  >
                    PROMPT WITHOUT CONTEXT
                  </button>
                </div>

                <Form.Item
                  label={"Question Generator Prompt"}
                  name="questionGeneratorPrompt"
                  rules={[
                    {
                      required: true,
                      message: "Please input a prompt!",
                    },
                  ]}
                >
                  <Input.TextArea size="large" rows={5} />
                </Form.Item>

                <Form.Item
                  name="use_hybrid_search"
                  label="Use Hybrid Search Retrieval"
                  valuePropName="checked"
                  tooltip="This will use the hybrid search retrieval method instead of the default semantic search retrieval method. Only work on playground ui."
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  name="bot_protect"
                  label="Activate Public Bot Protection"
                  valuePropName="checked"
                  tooltip="This will activate the public bot protection using session to avoid misuse of the bot"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="bot_model_api_key"
                  label="Chat Model API Key"
                  help="Enter your API key here. If you don't have one, you can leave this field blank."
                  tooltip="Enter your API key to use your own chat model. Currently, only OpenAI API keys are supported."
                >
                  <Input.Password
                    size="large"
                    placeholder="Enter your API key here"
                  />
                </Form.Item>

                <Form.Item
                  name="autoResetSession"
                  label="Auto Reset Chat Session"
                  tooltip="This will reset the chat session after a certain period of inactivity. Useful for platforms like Telegram, WhatsApp, etc."
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="inactivityTimeout"
                  label="Inactivity Timeout"
                  help="Enter the time in seconds after which the chat session will be reset."
                  rules={[
                    {
                      required: true,
                      message: "Please input an inactivity timeout!",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    placeholder="Enter inactivity timeout"
                  />
                </Form.Item>

              <Form.Item
                  name="autoSyncDataSources"
                  label="Auto Sync Data Source(s)"
                  tooltip="This will automatically re-fetch the URL-based data sources at a certain interval."
                >
                  <Switch />
                </Form.Item>
              </div>
            </div>

            <div className="mt-3 text-right">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white  hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </Form>

        <div className="bg-white border sm:rounded-lg dark:bg-[#1e1e1e] dark:border-gray-700">
          <SettingsPwdP
            publicBotPwd={data.publicBotPwd}
            publicBotPwdProtected={data.publicBotPwdProtected}
          />
        </div>

        <div className="bg-white border sm:rounded-lg dark:bg-[#1e1e1e] dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Make a copy of your bot
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>
                This action will create a new bot with the same settings as this
                bot, except for the Integration settings that need to be
                reconfigured{" "}
              </p>
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  const confirm = window.confirm(
                    "Are you sure you want to make a copy of this bot?"
                  );
                  if (confirm) {
                    copyBot();
                  }
                }}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
              >
                {isCopying ? "Copying..." : "Make a copy"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border sm:rounded-lg dark:bg-[#1e1e1e] dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Delete your bot
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>
                This action cannot be undone. This will permanently delete your
                bot and all of its data.
              </p>
            </div>
            <div className="mt-5">
              <button
                onClick={() => {
                  const confirm = window.confirm(
                    "Are you sure you want to delete this bot?"
                  );
                  if (confirm) {
                    deleteBot();
                  }
                }}
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:text-sm dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800 dark:focus:ring-red-900"
              >
                {isDeleting ? "Deleting..." : "Delete bot"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
