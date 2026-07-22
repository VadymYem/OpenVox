#define BUFFER_CAPACITY 8192

static float input_buffer[BUFFER_CAPACITY];
static float yin_buffer[BUFFER_CAPACITY / 2 + 1];
static float last_confidence = 0.0f;

__attribute__((export_name("get_buffer_ptr")))
float *get_buffer_ptr(void) {
  return input_buffer;
}

__attribute__((export_name("get_buffer_capacity")))
int get_buffer_capacity(void) {
  return BUFFER_CAPACITY;
}

__attribute__((export_name("get_last_confidence")))
float get_last_confidence(void) {
  return last_confidence;
}

static float clampf(float value, float minimum, float maximum) {
  return value < minimum ? minimum : (value > maximum ? maximum : value);
}

__attribute__((export_name("detect_pitch")))
float detect_pitch(int length, float sample_rate, float min_frequency, float max_frequency) {
  last_confidence = 0.0f;
  if (length < 64 || length > BUFFER_CAPACITY || sample_rate <= 0.0f || min_frequency <= 0.0f || max_frequency <= min_frequency) {
    return 0.0f;
  }

  float energy = 0.0f;
  float mean = 0.0f;
  for (int i = 0; i < length; i++) mean += input_buffer[i];
  mean /= (float)length;
  for (int i = 0; i < length; i++) {
    const float centered = input_buffer[i] - mean;
    energy += centered * centered;
  }
  const float rms = __builtin_sqrtf(energy / (float)length);
  if (rms < 0.0015f) return 0.0f;

  int min_tau = (int)(sample_rate / max_frequency);
  int max_tau = (int)(sample_rate / min_frequency);
  if (min_tau < 2) min_tau = 2;
  if (max_tau > length / 2) max_tau = length / 2;
  if (max_tau > BUFFER_CAPACITY / 2) max_tau = BUFFER_CAPACITY / 2;
  if (max_tau <= min_tau) return 0.0f;

  yin_buffer[0] = 1.0f;
  for (int tau = 1; tau <= max_tau; tau++) {
    float difference = 0.0f;
    const int limit = length - tau;
    for (int i = 0; i < limit; i++) {
      const float delta = input_buffer[i] - input_buffer[i + tau];
      difference += delta * delta;
    }
    yin_buffer[tau] = difference;
  }

  float running_sum = 0.0f;
  for (int tau = 1; tau <= max_tau; tau++) {
    running_sum += yin_buffer[tau];
    yin_buffer[tau] = running_sum > 1e-12f ? yin_buffer[tau] * (float)tau / running_sum : 1.0f;
  }

  const float threshold = 0.15f;
  int estimate = -1;
  for (int tau = min_tau; tau < max_tau; tau++) {
    if (yin_buffer[tau] < threshold) {
      while (tau + 1 < max_tau && yin_buffer[tau + 1] < yin_buffer[tau]) tau++;
      estimate = tau;
      break;
    }
  }

  if (estimate < 0) {
    int best_tau = min_tau;
    for (int tau = min_tau + 1; tau <= max_tau; tau++) {
      if (yin_buffer[tau] < yin_buffer[best_tau]) best_tau = tau;
    }
    if (yin_buffer[best_tau] > 0.42f) return 0.0f;
    estimate = best_tau;
  }

  float refined_tau = (float)estimate;
  if (estimate > min_tau && estimate < max_tau) {
    const float left = yin_buffer[estimate - 1];
    const float center = yin_buffer[estimate];
    const float right = yin_buffer[estimate + 1];
    const float denominator = 2.0f * (2.0f * center - right - left);
    if (denominator > 1e-9f || denominator < -1e-9f) {
      refined_tau += (right - left) / denominator;
    }
  }

  if (refined_tau <= 0.0f) return 0.0f;
  const float frequency = sample_rate / refined_tau;
  if (frequency < min_frequency || frequency > max_frequency) return 0.0f;

  const float periodicity = 1.0f - yin_buffer[estimate];
  const float level_factor = clampf((rms - 0.0015f) / 0.018f, 0.0f, 1.0f);
  last_confidence = clampf(periodicity * (0.72f + 0.28f * level_factor), 0.0f, 1.0f);
  return frequency;
}
