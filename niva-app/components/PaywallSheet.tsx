import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../lib/theme";

const { height: SCREEN_H } = Dimensions.get("window");

interface Props {
  isOpen: boolean;
  address: string;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export function PaywallSheet({ isOpen, address, onClose, onPaymentComplete }: Props) {
  const [processing, setProcessing] = useState(false);

  async function handlePay() {
    setProcessing(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 1200));
    setProcessing(false);
    onPaymentComplete();
    onClose();
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.backdrop} onPress={onClose}>
        <View />
      </Pressable>
      <View style={s.sheet}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Content */}
        <View style={s.content}>
          <Text style={s.title}>Lås upp djupanalys</Text>
          <Text style={s.address}>{address}</Text>

          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Engångsbelopp</Text>
            <Text style={s.price}>99 kr</Text>
          </View>

          <View style={s.features}>
            {[
              "AI-analyserad årsredovisning",
              "Riskbaserade kontrollfrågor till mäklaren",
              "Interaktiv bud-simulator",
            ].map((f) => (
              <View key={f} style={s.featureRow}>
                <Text style={s.featureCheck}>✓</Text>
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Pay button */}
          <Pressable
            onPress={handlePay}
            disabled={processing}
            style={[s.payBtn, processing && { opacity: 0.7 }]}
          >
            {processing ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={s.payBtnText}>
                Betala med Apple Pay
              </Text>
            )}
          </Pressable>

          {/* Alt pay */}
          <Pressable
            onPress={handlePay}
            disabled={processing}
            style={s.altBtn}
          >
            <Text style={s.altBtnText}>Betala med kort</Text>
          </Pressable>

          <Text style={s.disclaimer}>
            Betalningen behandlas säkert. Inga återkommande avgifter.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: SCREEN_H * 0.85,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.stone,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  content: { padding: 24 },
  title: {
    fontSize: 22,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  priceLabel: { fontSize: 14, color: Colors.textSecondary },
  price: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    color: Colors.midnight,
  },
  features: { gap: 12, marginBottom: 24 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureCheck: {
    fontSize: 14,
    color: Colors.gradeGreen,
    fontFamily: "DMSans_700Bold",
  },
  featureText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  payBtn: {
    backgroundColor: Colors.midnight,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  payBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
  },
  altBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  altBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    color: Colors.textSecondary,
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
});
