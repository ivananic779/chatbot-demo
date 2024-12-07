import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Anthropic } from '@anthropic-ai/sdk';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TASK_CONTEXT, SERVICES, TONE_CONTEXT, TASK_DESCRIPTION, EXAMPLES, IMMEDIATE_TASK, PRECOGNITION, OUTPUT_FORMATTING, PREFILL } from './variables/chat-constants'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'chatbot-demo';
  apiKey: string = '';
  anthropic: Anthropic | null = null;

  systemMessage: string = `${TASK_CONTEXT}\n${SERVICES}\n${TONE_CONTEXT}\n${TASK_DESCRIPTION}\n${EXAMPLES}\n${IMMEDIATE_TASK}\n${PRECOGNITION}\n${OUTPUT_FORMATTING}`;

  public messageHistory: Anthropic.Messages.MessageParam[] = [];

  userInput: string = '';

  showSystemMessage: boolean = false;

  currentStreamedMessage: string = '';

  toggleSystemMessage() {
    this.showSystemMessage = !this.showSystemMessage;
  }

  async sendMessage() {
    if (!this.apiKey) {
      alert('Please enter an API key first');
      return;
    }

    if (!this.anthropic) {
      this.anthropic = new Anthropic({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true
      });
    }

    if (!this.userInput.trim()) return;

    const userMessage: Anthropic.Messages.MessageParam = {
      role: 'user',
      content: this.userInput
    };
    this.messageHistory.push(userMessage);
    this.userInput = '';
    this.currentStreamedMessage = '';

    try {
      const stream = await this.anthropic.messages.stream({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2048,
        temperature: 0.0,
        system: this.systemMessage,
        messages: this.messageHistory,
      });

      stream.on('text', (text) => {
        this.currentStreamedMessage += text;
        // Force Angular change detection
        (window as any).requestAnimationFrame(() => {});
      });

      stream.on('end', () => {
        this.messageHistory.push({
          role: 'assistant',
          content: this.currentStreamedMessage
        });
        this.currentStreamedMessage = '';
      });

      stream.on('error', (error) => {
        console.error('Stream error:', error);
        this.messageHistory.push({
          role: 'assistant',
          content: 'Sorry, there was an error processing your message.'
        });
      });

    } catch (error) {
      console.error('Error:', error);
      this.messageHistory.push({
        role: 'assistant',
        content: 'Sorry, there was an error processing your message.'
      });
    }
  }
}
